/* globals require, __dirname, Buffer */

const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const dayjs = require('dayjs');
const hostlistCompiler = require('@adguard/hostlist-compiler');
const mastodonServerlistCompiler = require('./mastodon');
const { listDirs, writeFile, readFile, DeferredRunner } = require('./utils/io');
const Revision = require('./utils/revision');
const TagsMetadataUtils = require('./utils/tags');
const replaceExpires = require('./utils/expires');
const filterKeyValidatorFactory = require('./utils/validateFilterKey');

const HOSTLISTS_URL = 'https://adguardteam.github.io/HostlistsRegistry/assets';

const CONFIGURATION_FILE = 'configuration.json';
const REVISION_FILE = 'revision.json';
const METADATA_FILE = 'metadata.json';
const SERVICES_FILE = 'services.json';

const FILTERS_METADATA_FILE = 'filters.json';
const FILTERS_METADATA_DEV_FILE = 'filters-dev.json';
const FILTERS_I18N_METADATA_FILE = 'filters_i18n.json';

const OUTPUT_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZZ';

/**
 * Lists directories with filters metadata in the base dir
 *
 * @param baseDir Base directory
 *
 * @return {*}
 */
const listFiltersDirs = async function (baseDir) {
  const childDirs = await listDirs(baseDir);

  let filterDirs = [];
  for (const dir of childDirs) {
    if (fs.existsSync(path.join(dir, CONFIGURATION_FILE))) {
      filterDirs.push(dir);
    } else {
      filterDirs = filterDirs.concat(await listFiltersDirs(dir));
    }
  }
  return filterDirs;
}

/**
 * Calculates revision for compiled rules.
 * NOTE: "! Last modified:" and "! Version" lines are excluded from the calculation because these fields updating each time hostlist-compiler invoked
 *
 * @param compiled Array with compiled rules
 *
 * @return {String}
 */
const calculateRevisionHash = function (compiled) {
  const data = compiled.filter(s => !(s.startsWith('! Last modified:') || s.startsWith('! Version:')))
    .join('\n');

  return Buffer.from(md5(data, { asString: true })).toString('base64').trim();
}

const readHostlistConfiguration = async function (filterDir) {
  const configurationFile = path.join(filterDir, CONFIGURATION_FILE);
  return JSON.parse(await readFile(configurationFile));
}

/**
 * Parses object info
 * Splits string {mask}{id}.{message} like "filter.1.name" etc.
 *
 * @param string
 * @param mask
 *
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
const loadLocales = async function (dir) {
  const result = {
    tags: {},
    filters: {},
    groups: {},
  };

  const localeDirs = await listDirs(dir);
  for (const localeDir of localeDirs) {
    const locale = path.basename(localeDir);

    const items = [{
      file: path.join(localeDir, 'tags.json'),
      prefix: 'hostlisttag.',
      propName: 'tags'
    }, {
      file: path.join(localeDir, 'filters.json'),
      prefix: 'hostlist.',
      propName: 'filters',
    }, {
      file: path.join(localeDir, 'groups.json'),
      prefix: 'hostlistgroup.',
      propName: 'groups',
    }];

    for (const { file, prefix, propName } of items) {
      const messagesJson = JSON.parse(await readFile(file));
      if (messagesJson) {
        for (const message of messagesJson) {
          for (const property of Object.keys(message)) {
            const info = parseInfo(property, prefix);
            if (!info || !info.id) {
              continue;
            }
            const { id } = info;
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

async function build(filtersDir, tagsDir, localesDir, assetsDir, groupsDir) {
  const filtersMetadata = [];
  const filtersMetadataDev = [];
  const filterKeyValidator = filterKeyValidatorFactory();
  const deferredRunner = new DeferredRunner();
  const tagsMetadata = JSON.parse(await readFile(path.join(tagsDir, METADATA_FILE)));
  const tagsMetadataUtils = new TagsMetadataUtils(tagsMetadata.slice());

  const filterDirs = await listFiltersDirs(filtersDir);
  for (const filterDir of filterDirs) {
    const metadata = JSON.parse(await readFile(path.join(filterDir, METADATA_FILE)));

    // Validate filterKey field
    filterKeyValidator.validate(metadata.filterKey);

    // Reads the current revision information.
    const revisionFile = path.join(filterDir, REVISION_FILE);
    const revision = new Revision(JSON.parse(await readFile(revisionFile)));
    /**
     * A new filter revision
     * 
     * @type {Revision|undefined}
     */
    let newRevision;

    if (typeof metadata.filterId === 'undefined') {
      throw new Error('You should use `filterId` instead of `id` in metadata.json');
    }

    // Compiles the hostlist using provided configuration.
    const hostlistConfiguration = await readHostlistConfiguration(filterDir);
    const filterName = `filter_${metadata.filterId}.txt`;

    // If the hostlist is disabled, do not attempt to download it, just use the
    // existing one.
    if (!metadata.disabled) {
      try {
        revision.setVersionCandidate();
        revision.setTimeUpdatedCandidate();

        const hostlistCompiled = await hostlistCompiler({
          ...hostlistConfiguration,
          version: revision.getVersionCandidate(),
        });

        const hash = calculateRevisionHash(hostlistCompiled);

        // Rewrites the filter if it's actually changed.
        if (revision.getOriginalHash() !== hash) {
          // Make new revision here
          newRevision = revision.makeNewRevisionFromCandidates(hash);
          const assetsFilterFile = path.join(assetsDir, filterName);
          const filterFile = path.join(filterDir, 'filter.txt');
          const content = hostlistCompiled.join('\n');

          // We don't write files now, cause next iteration may fails.
          // We will do it after all filters have been successfully compiled
          deferredRunner.push(async () => {
            return Promise.all([
              writeFile(revisionFile, newRevision.makePlainObjectFromOriginalValues()),
              writeFile(assetsFilterFile, content),
              writeFile(filterFile, content),
            ]);
          });
        }
      } catch (ex) {
        throw new Error(`Failed to compile ${metadata.id}: ${ex}`);
      }
    }

    const downloadUrl = `${HOSTLISTS_URL}/${filterName}`;

    let subscriptionUrl;
    if (hostlistConfiguration.sources.length === 1) {
      subscriptionUrl = hostlistConfiguration.sources[0].source;
    } else {
      subscriptionUrl = metadata.homepage;
    }

    // populates metadata for filter
    const filterMetadata = {
      filterKey: metadata.filterKey,
      filterId: metadata.filterId,
      groupId: metadata.groupId,
      name: metadata.name,
      deprecated: Boolean(metadata.deprecated),
      description: metadata.description,
      tags: tagsMetadataUtils.mapTagKeywordsToTheirIds(metadata.tags),
      languages: tagsMetadataUtils.parseLangTag(metadata.tags),
      version: (newRevision || revision).getOriginalVersion(),
      homepage: metadata.homepage,
      expires: replaceExpires(metadata.expires),
      displayNumber: metadata.displayNumber,
      downloadUrl,
      subscriptionUrl,
      timeAdded: dayjs(metadata.timeAdded).format(OUTPUT_DATE_FORMAT),
      timeUpdated: dayjs((newRevision || revision).getOriginalTimeUpdated()).format(OUTPUT_DATE_FORMAT),
    };

    if (metadata.environment === 'prod') {
      filtersMetadata.push(filterMetadata);
    }

    filtersMetadataDev.push(filterMetadata);
  }

  // Run all async tasks after loop ends
  await deferredRunner.run();

  // Build Mastodon dynamic server list
  const services = JSON.parse(await readFile(path.join(assetsDir, SERVICES_FILE)));
  const mastodonServers = await mastodonServerlistCompiler();

  const mastodonIndex = services.blocked_services
    .findIndex((el) => {
      return el.id === 'mastodon';
    });

  if (mastodonIndex == -1) {
    throw new Error('Mastodon service not found');
  }

  // Set Mastodon server list to be blocked
  const mastodonService = services.blocked_services[mastodonIndex];
  mastodonService.rules = mastodonServers;
  services.blocked_services[mastodonIndex] = mastodonService;

  // Write Mastodon dynamic server list to service.json
  const servicesFile = path.join(assetsDir, SERVICES_FILE);
  await writeFile(servicesFile, JSON.stringify(services, undefined, 2));

  const groupsMetadata = JSON.parse(await readFile(path.join(groupsDir, METADATA_FILE)));

  // writes the populated metadata for all filters, tags, etc that are marked as "prod"
  const filtersMetadataFile = path.join(assetsDir, FILTERS_METADATA_FILE);
  await writeFile(filtersMetadataFile, { filters: filtersMetadata, tags: tagsMetadata, groups: groupsMetadata });

  // writes the metadata for all filters, tags, etc that are marked as "dev"
  const filtersMetadataDevFile = path.join(assetsDir, FILTERS_METADATA_DEV_FILE);
  await writeFile(filtersMetadataDevFile, { filters: filtersMetadataDev, tags: tagsMetadata, groups: groupsMetadata });

  // writes localizations for all filters, tags, etc
  const localizations = await loadLocales(localesDir);
  const filtersI18nFile = path.join(assetsDir, FILTERS_I18N_METADATA_FILE);
  const i18nMetadata = {
    groups: localizations.groups,
    tags: localizations.tags,
    filters: localizations.filters,
  };
  await writeFile(filtersI18nFile, i18nMetadata);
}

module.exports = {
  build
};
