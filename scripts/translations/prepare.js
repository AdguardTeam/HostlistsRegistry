// Prepares filters.json, groups.json and tags.json in the locales folder
// Run with node scripts/translations/prepare.js
const fs = require('fs');
const path = require('path');

const ROOT_PATH = path.join(__dirname, '../..');
const TAGS_META_PATH = path.join(ROOT_PATH, 'tags/metadata.json');
const GROUPS_META_PATH = path.join(ROOT_PATH, 'groups/metadata.json');
const FILTERS_META_PATH = path.join(ROOT_PATH, 'filters');
const BASE_LOCALE_DIR = path.join(ROOT_PATH, 'locales/en');
const FILTERS_FILE = path.join(BASE_LOCALE_DIR, 'filters.json');
const TAGS_FILE = path.join(BASE_LOCALE_DIR, 'tags.json');
const GROUPS_FILE = path.join(BASE_LOCALE_DIR, 'groups.json');
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

/**
 * Returns id of hostlist, hostlisttag or hostlistgroup in the input object.
 *
 * @param {object} input Base locale object.
 *
 * @returns {number} Id of hostlist or hostlisttag.
 */
const getId = (input) => {
    // get any key in the object with name and description
    const key = Object.keys(input)[0];
    // id is the part after the first dot in the key
    const id = key.split('.')[1];
    return parseInt(id);
};

/**
 * Sorts base language items by id.
 *
 * @param {Array<object>} inputItems Unsorted base language items.
 *
 * @returns {Array<object>} Sorted base language items.
 */
const sortBaseLanguageItems = (inputItems) => {
    return inputItems.sort((a, b) => {
        return getId(a) - getId(b);
    });
};

const tagsMetadata = require(TAGS_META_PATH);
const groupsMetadata = require(GROUPS_META_PATH);
const filtersMetadata = readFiltersMeta(FILTERS_META_PATH);
const filtersBaseLanguage = require(FILTERS_FILE);
const tagsBaseLanguage = require(TAGS_FILE);
const groupsBaseLanguage = require(GROUPS_FILE);

const processedTags = new Set();
const processedGroups = new Set();
for (let filter of filtersMetadata) {
    const id = filter.id;
    const name = filter.name;
    const description = filter.description;
    const filterTags = filter.tags;

    const filterNameKey = `hostlist.${id}.name`;
    const filterDescriptionKey = `hostlist.${id}.description`;

    let filterLocalisationFindInBaseFile = filtersBaseLanguage
        .some((entry) => entry.hasOwnProperty(filterNameKey));

    if (!filterLocalisationFindInBaseFile) {
        filtersBaseLanguage.push({
            [filterNameKey]: name,
            [filterDescriptionKey]: description
        });
    }

    // Tags
    for (let tagKeyword of filterTags) {
        if (processedTags.has(tagKeyword)) {
            continue;
        }

        const tagMeta = tagsMetadata.find((el) => el.keyword === tagKeyword)
        if (!tagMeta) {
            throw new Error(`Cannot find tag metadata ${tagKeyword}, fix it in ${TAGS_FILE}`);
        }

        const tagNameKey = `hostlisttag.${tagMeta.tagId}.name`;
        const tagDescriptionKey = `hostlisttag.${tagMeta.tagId}.description`;

        let tagLocalisationFoundInBaseFile = tagsBaseLanguage
            .some((entry) => entry.hasOwnProperty(tagNameKey));

        if (!tagLocalisationFoundInBaseFile) {
            tagsBaseLanguage.push({
                [tagNameKey]: `TODO: name for tag ${tagMeta.keyword}`,
                [tagDescriptionKey]: `TODO: description for tag ${tagMeta.keyword}`
            });
        }

        processedTags.add(tagKeyword);
    }

    // Group
    if (!processedGroups.has(filter.groupId)) {
        const groupMeta = groupsMetadata.find((el) => el.groupId === filter.groupId);
        if (!groupMeta) {
            throw new Error(`Cannot find group metadata for groupId ${filter.groupId}, fix it in ${GROUPS_FILE}`);
        }

        const groupNameKey = `hostlistgroup.${filter.groupId}.name`;

        let groupLocalisationFoundInBaseFile = groupsBaseLanguage
            .some((entry) => entry.hasOwnProperty(groupNameKey));

        if (!groupLocalisationFoundInBaseFile) {
            groupsBaseLanguage.push({
                [groupNameKey]: `TODO: name for group ${filter.groupId}`
            });
        }

        processedGroups.add(filter.groupId);
    }
}

fs.writeFileSync(
    FILTERS_FILE,
    JSON.stringify(sortBaseLanguageItems(filtersBaseLanguage), 0, '\t'),
);

fs.writeFileSync(
    TAGS_FILE,
    JSON.stringify(sortBaseLanguageItems(tagsBaseLanguage), 0, '\t'),
);

fs.writeFileSync(
    GROUPS_FILE,
    JSON.stringify(sortBaseLanguageItems(groupsBaseLanguage), 0, '\t')
);
