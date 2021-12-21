// Prepares filters.json and tags.json in the locales folder
// Run with node scripts/translations/prepare.js
const fs = require('fs');
const path = require('path');

const TAGS_META_PATH = 'tags/metadata.json';
const FILTERS_META_PATH = 'filters';
const BASE_LOCALE_DIR = 'locales/en';
const FILTERS_FILE = path.join(BASE_LOCALE_DIR, 'filters.json');
const TAGS_FILE = path.join(BASE_LOCALE_DIR, 'tags.json');
const METADATA_FILE = 'metadata.json';

/**
 * readFiltersMeta reads all blocklists metadata.
 * @param {String} baseDir - base dir for filters metadata.
 */
const readFiltersMeta = (baseDir) => {
    const childDirs = fs.readdirSync(baseDir)
        .filter(file => fs.statSync(path.join(baseDir, file)).isDirectory());

    let filters = [];
    for (let dir of childDirs) {
        const dirPath = path.join(baseDir, dir);
        const metaPath = path.join(dirPath, METADATA_FILE);
        if (fs.existsSync(metaPath)) {
            const filterMeta = JSON.parse(fs.readFileSync(metaPath).toString());
            filters.push(filterMeta);
        } else {
            filters = filters.concat(readFiltersMeta(dirPath));
        }
    }

    return filters;
}

const tags = JSON.parse(fs.readFileSync(TAGS_META_PATH).toString());
const filters = readFiltersMeta(FILTERS_META_PATH);
const filtersBaseLanguage = JSON.parse(fs.readFileSync(FILTERS_FILE));
const tagsBaseLanguage = JSON.parse(fs.readFileSync(TAGS_FILE));

for (let filter of filters) {
    const id = filter.id;
    const name = filter.name;
    const description = filter.description;
    const filterTags = filter.tags;

    const filterNameKey = `filter.${id}.name`;
    const filterDescriptionKey = `filter.${id}.description`;
    let found = false;

    for (let filterLocale of filtersBaseLanguage) {
        if (filterNameKey in filterLocale) {
            filterLocale[filterNameKey] = name;
            filterLocale[filterDescriptionKey] = description;
            found = true;
            break;
        }
    }

    if (!found) {
        const filterLocale = {};
        filterLocale[filterNameKey] = name;
        filterLocale[filterDescriptionKey] = description;
        filtersBaseLanguage.push(filterLocale);
    }

    for (let tag of filterTags) {
        const tagMeta = tags.find((el) => el.keyword === tag)
        if (!tagMeta) {
            throw new Error(`Cannot find tag metadata ${tag}, fix it in ${TAGS_FILE}`);
        }

        const tagNameKey = `tag.${tagMeta.id}.name`;
        const tagDescriptionKey = `tag.${tagMeta.id}.description`;
        let found = false;

        for (let tagLocale in tagsBaseLanguage) {
            if (tagNameKey in tagLocale) {
                found = true;
                break;
            }
        }

        if (!found) {
            const tagLocale = {};
            tagLocale[tagNameKey] = `TODO: name for tag ${tagMeta.keyword}`;
            tagLocale[tagDescriptionKey] = `TODO: description for tag ${tagMeta.keyword}`;
        }
    }
}

fs.writeFileSync(FILTERS_FILE, JSON.stringify(filtersBaseLanguage, 0, 4));
fs.writeFileSync(TAGS_FILE, JSON.stringify(tagsBaseLanguage, 0, 4));