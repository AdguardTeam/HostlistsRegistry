/* globals require, __dirname, Buffer */

const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const hostlistCompiler = require('@adguard/hostlist-compiler');

const HOSTLISTS_URL = 'https://adguardteam.github.io/HostlistsRegistry/assets';

const CONFIGURATION_FILE = 'configuration.json';
const REVISION_FILE = 'revision.json';
const METADATA_FILE = 'metadata.json';

const FILTERS_METADATA_FILE = 'filters.json';
const FILTERS_I18N_METADATA_FILE = 'filters_i18n.json';

/**
 * Sync reads file content
 *
 * @param path
 * @returns {*}
 */
const readFile = function (path) {
  if (!fs.existsSync(path)) {
    return null;
  }
  return fs.readFileSync(path, { encoding: 'utf-8' });
};

/**
 * Sync writes content to file
 *
 * @param path
 * @param data
 */
const writeFile = function (path, data) {
  fs.writeFileSync(path, data, 'utf8');
};

/**
 * Lists directories in the base dir
 * @param baseDir Base directory
 * @return {*}
 */
const listDirs = function (baseDir) {
  const childDirs = fs.readdirSync(baseDir)
    .filter(file => fs.statSync(path.join(baseDir, file)).isDirectory());

  let filterDirs = [];
  for (let dir of childDirs) {
    const dirPath = path.join(baseDir, dir);
    if (fs.existsSync(path.join(dirPath, CONFIGURATION_FILE))) {
      filterDirs.push(dirPath);
    } else {
      filterDirs = filterDirs.concat(listDirs(dirPath));
    }
  }
  return filterDirs;
}

/**
 * Creates revision object,
 * doesn't update timeUpdated if hash is not changed
 *
 * @param currentRevision
 * @param hash
 * @returns {{timeUpdated: number, hash: String}}
 */
const makeRevision = function (currentRevision, hash) {

  const result = {
    timeUpdated: new Date().getTime(),
    hash,
  };

  if (currentRevision && currentRevision.hash === result.hash) {
    result.timeUpdated = currentRevision.timeUpdated;
  }

  return result;
};

/**
 * Calculates revision for compiled rules.
 * NOTE: "! Last modified:" comment is excluded from the calculation because it's updating each time hostlist-compiler invoked
 *
 * @param compiled Array with compiled rules
 * @return {String}
 */
const calculateRevisionHash = function (compiled) {
  const data = compiled.filter(s => !s.startsWith('! Last modified:')).join('\n');
  return Buffer.from(md5(data, { asString: true })).toString('base64').trim();
}

/**
 * Parses "Expires" field and converts it to seconds
 *
 * @param expires
 */
const replaceExpires = function (expires) {
  if (expires) {
    if (expires.indexOf('day') > 0) {
      expires = parseInt(expires, 10) * 24 * 60 * 60;
    } else if (expires.indexOf('hour') > 0) {
      expires = parseInt(expires, 10) * 60 * 60;
    }
    if (Number.isNaN(expires)) {
      // Default
      expires = 86400;
    }
  }
  return expires || 86400;
};

const readHostlistConfiguration = function (filterDir) {
  const configurationFile = path.join(filterDir, CONFIGURATION_FILE);
  return JSON.parse(readFile(configurationFile));
}

/**
 * Parses object info
 * Splits string {mask}{id}.{message} like "filter.1.name" etc.
 *
 * @param string
 * @param mask
 * @returns {{id: *, message: *}}
 */
const parseInfo = (string, mask) => {
  const searchIndex = string.indexOf(mask) + mask.length;
  return {
    id: string.substring(searchIndex, string.indexOf('.', searchIndex)),
    message: string.substring(string.lastIndexOf('.') + 1),
  };
};

/**
 * Loads localizations
 *
 * @param dir
 */
const loadLocales = function (dir) {

  const result = {
    tags: {},
    filters: {},
  };

  const localeDirs = listDirs(dir);
  for (const localeDir of localeDirs) {

    const locale = path.basename(localeDir);

    const items = [{
      file: path.join(localeDir, 'tags.json'),
      prefix: 'hostlisttag.',
      propName: 'tags'
    }, {
      file: path.join(localeDir, 'filters.json'),
      prefix: 'hostlist.',
      propName: 'filters'
    }];

    for (let item of items) {
      const messagesJson = JSON.parse(readFile(item.file));
      if (messagesJson) {
        for (const message of messagesJson) {
          for (const property of Object.keys(message)) {
            const info = parseInfo(property, item.prefix);
            if (!info || !info.id) {
              continue;
            }
            const { id } = info;
            const propName = item.propName;
            result[propName][id] = result[propName][id] || {};
            result[propName][id][locale] = result[propName][id][locale] || {};
            result[propName][id][locale][info.message] = message[property];
          }
        }
      }
    }
  }

  return result;
};

async function build(filtersDir, tagsDir, localesDir, assetsDir) {

  const filtersMetadata = [];

  const filterDirs = listDirs(filtersDir);
  for (const filterDir of filterDirs) {

    const metadata = JSON.parse(readFile(path.join(filterDir, METADATA_FILE)));

    // compiles the hostlist using provided configuration
    const hostlistConfiguration = readHostlistConfiguration(filterDir);
    const hostlistCompiled = await hostlistCompiler(hostlistConfiguration);

    // calculates hash and updates revision
    const hash = calculateRevisionHash(hostlistCompiled);
    const revisionFile = path.join(filterDir, REVISION_FILE);
    const currentRevision = JSON.parse(readFile(revisionFile)) || {};
    const newRevision = makeRevision(currentRevision, hash);
    writeFile(revisionFile, JSON.stringify(newRevision, null, '\t'));

    // Rewrites filter if it's actually changed
    let filterName = `filter_${metadata.id}.txt`;
    if (currentRevision.hash !== hash) {
      const assertsFilterFile = path.join(assetsDir, filterName);
      const filterFile = path.join(filterDir, 'filter.txt');
      let content = hostlistCompiled.join('\n');
      writeFile(assertsFilterFile, content);
      writeFile(filterFile, content);
    }

    const downloadUrl = `${HOSTLISTS_URL}/${filterName}`;

    let sourceUrl;
    if (hostlistConfiguration.sources.length === 1) {
      sourceUrl = hostlistConfiguration.sources[0].source;
    } else {
      // TODO:
    }

    // populates metadata for filter
    const filterMetadata = {
      filterId: metadata.filterId,
      name: metadata.name,
      description: metadata.description,
      tags: metadata.tags,
      homepage: metadata.homepage,
      expires: replaceExpires(metadata.expires),
      displayNumber: metadata.displayNumber,
      downloadUrl: downloadUrl,
      sourceUrl: sourceUrl,
      timeAdded: metadata.timeAdded,
      timeUpdated: newRevision.timeUpdated,
    };
    filtersMetadata.push(filterMetadata);
  }

  // copy tags as is
  const tagsMetadata = JSON.parse(readFile(path.join(tagsDir, METADATA_FILE)));

  // writes the populated metadata for all filters, tags, etc
  const filtersMetadataFile = path.join(assetsDir, FILTERS_METADATA_FILE);
  writeFile(filtersMetadataFile, JSON.stringify({ filters: filtersMetadata, tags: tagsMetadata }, null, '\t'));

  // writes localizations for all filters, tags, etc
  const localizations = loadLocales(localesDir);
  const filtersI18nFile = path.join(assetsDir, FILTERS_I18N_METADATA_FILE);
  const i18nMetadata = {
    tags: localizations.tags,
    filters: localizations.filters,
  };
  writeFile(filtersI18nFile, JSON.stringify(i18nMetadata, null, '\t'));
}

module.exports = {
  build
};
