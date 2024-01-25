const { promises: fs, existsSync, readFileSync } = require('fs');
const path = require('path');
const { logger } = require('../helpers/logger');

const SERVICES_TRANSLATION_FILE = 'services.json';
const BASE_LOCALE_DIR = 'locales/en';
const SERVICES_BASE_TRANSLATION_FILEPATH = path.join(BASE_LOCALE_DIR, SERVICES_TRANSLATION_FILE);

/**
 * Returns only directories names from folder
 *
 * @param {string} folderPath folder path
 * @returns {Array<string>} only directories names in folder
 */
const getDirNames = async (folderPath) => {
    try {
        return (await fs.readdir(folderPath, { withFileTypes: true }))
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
    } catch (error) {
        logger.error('Error getting directories names');
        throw new Error(error);
    }
};

/**
 * @typedef {{
 *   [id: string]: {
 *     [locale: string]: {
 *       name: string;
 *     };
 *   };
 * }} groupedFileObjects
 *
 * where
 * - `id` is a group id, used in yml files
 * - `locale` is a locale code, e.g. `en`, `es`, etc.
 * - `name` is a group name from a specific locale
 *
 * Example:
 *
 * {
 *    'id1': {
 *        'en': { name: 'en-value1' },
 *        'es': { name: 'es-value1' }
 *    },
 *    'id2': {
 *        'en': { name: 'en-value2' },
 *        'fr': { name: 'fr-value2' }
 *    },
 * }
 */

/**
 * Groups file content by translations for a specific locale.
 *
 * @param {Array<object>} fileObjects - An array of objects representing file content.
 * @param {string} locale - The locale for which to group the file objects.
 * Locale corresponds to the name of the directory from which the information is taken
 * @returns {groupedFileObjects} An object containing grouped translations by component id,
 * sign (name, description etc.) and locale.
 */
const groupFileContentByTranslations = (fileObjects, locale) => {
    // Initialize an empty object to store grouped translations
    const groupedFileObjects = {};

    fileObjects.forEach((fileObject) => {
        // Initialize empty objects for translation, locales, and component locales (groups id)
        const translate = {};
        const localesTranslate = {};
        const componentLocalesTranslate = {};
        // { "servicesgroup.cdn.name": "Cdn" }
        Object.entries(fileObject).forEach(([key, value]) => {
            // Skip TODO comments
            if (value.includes('TODO:')) return;
            // Destructure the key into category, id, and sign (name, description, etc.)
            // servicesgroup.cdn.name --> id - cdn , sign - name
            const [, id, sign] = key.split('.');
            // { name: "Cdn" }
            translate[sign] = value;
            // locale - directory name
            // {en: { name: "Cdn" } }
            localesTranslate[locale] = translate;
            // {cdn : {en: { name: "Cdn" } } }
            componentLocalesTranslate[id] = localesTranslate;
        });
        // Merge component locales into the groupedFileObjects
        Object.assign(groupedFileObjects, componentLocalesTranslate);
    });

    return groupedFileObjects;
};
/**
 * Asynchronously reads file content from specified directories, groups the content by translations,
 * and returns an object representing the grouped translations.
 *
 * @param {string} localesFolder - The base path to the folder containing the directories.
 * @returns {Promise<object>} A promise that resolves to an object representing grouped translations.
 *
 * @throws {Error} If there is an issue reading the file or parsing its content.
 */
const getGroupedTranslations = async (localesFolder) => {
    try {
        // Get an array of locale directories in the base folder
        const localesDirectories = await getDirNames(localesFolder);
        const existingTranslations = [];
        // Collect translations from each directory
        localesDirectories.forEach((directory) => {
            // File path to the translation file
            const translationFilePath = path.join(localesFolder, directory, SERVICES_TRANSLATION_FILE);
            // Check if the translation file exists
            if (existsSync(translationFilePath)) {
                // Read and parse the translation content
                const translationContent = JSON.parse(readFileSync(translationFilePath));
                // Group translations by id, locale and use (name, description etc.)
                existingTranslations.push(groupFileContentByTranslations(translationContent, directory));
            }
        });
        // Reduce the array of translations into a single grouped object
        return existingTranslations.reduce((acc, obj) => {
            // Merge translations for each component and locale
            Object.entries(obj).forEach(([key, value]) => {
                acc[key] = { ...acc[key], ...value };
            });
            return acc;
        }, {});
    } catch (error) {
        logger.error(`Error getting grouped translations: ${error}`);
        throw new Error(error);
    }
};

/**
 * @typedef {{groups: groupedFileObjects}} categoryLocalesTranslate
 * @property {object} groupedFileObjects - An object containing grouped translations
 * for a specific group within a category and locale.
 */

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories.
 *
 * @param {string} localesFolder - The base path to the folder containing locale directories.
 * @returns {categoryLocalesTranslate} A promise that resolves to an object representing grouped translations
 * for different locales.
 *
 * @throws {Error} If there is an issue finding directories or retrieving grouped translations.
 */
const getLocales = async (localesFolder) => {
    try {
        // Initialize an object to store grouped translations
        const categoryLocalesTranslate = {};
        // Get grouped translations for all locale directories
        categoryLocalesTranslate.groups = await getGroupedTranslations(localesFolder);
        return categoryLocalesTranslate;
    } catch (error) {
        logger.error(`Error getting locales: ${error}`);
        throw new Error(error);
    }
};

/**
 * Sorts an array of translation objects based on their keys.
 *
 * @param {Array<object>} translations - Array of translation objects.
 * @returns {Array<object>} - Sorted array of translation objects.
 */
const sortByKeys = (translations) => translations.sort((a, b) => {
    const keysA = Object.keys(a).join('');
    const keysB = Object.keys(b).join('');

    if (keysA < keysB) return -1;
    if (keysA > keysB) return 1;
    return 0;
});

/**
 * Checks if translations exist for groups from the services file in the base locale.
 *
 * @param {string} servicesFile - Path to the file containing service data.
 * @param {string} translationsFile - Path to the file containing base locale translations.
 * @returns {Promise<void>} - A promise that resolves once the operation is complete.
 */
const checkBaseTranslations = async (servicesFile, translationsFile) => {
    try {
        // Read service data and translations from files
        const servicesData = JSON.parse(await fs.readFile(servicesFile));
        const { groups } = servicesData;
        const translations = JSON.parse(await fs.readFile(translationsFile));
        // Create a set of translation IDs
        const translationsIds = new Set(translations.map((translation) => Object.keys(translation)[0]));
        const missingLocales = [];
        // Check each group for missing translations
        groups.forEach((group) => {
            const groupString = `servicesgroup.${group.id}.name`;
            if (!translationsIds.has(groupString)) {
                missingLocales.push({ [groupString]: `TODO: name for group ${group.id}` });
            }
        });
        // If there are no translations for some groups - TODO comment is added
        if (missingLocales.length > 0) {
            // Sort existing translations and missing translations
            const sortedTranslations = sortByKeys([...translations, ...missingLocales]);
            // Write sorted translations back to the translations file
            await fs.writeFile(translationsFile, JSON.stringify(sortedTranslations, null, 4));
            logger.warning(
                'Don\'t forget to add the missing translations in base locale',
            );
        }
    } catch (error) {
        // Handle any errors that occurred during the operation
        logger.error('Error when checking for translations in base locale:', error.message);
    }
};

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories
 * and writes the localizations to a specified file path.
 *
 * @param {string} outputServicesFile - The file path to the services file.
 * @param {string} localesFolder - The base path to the folder containing locale directories.
 * @param {string} i18nFilePath - The file path where the localizations will be written.
 * @returns {Promise<void>} A promise that resolves when the localizations are successfully written to the file.
 *
 * @throws {Error} If there is an issue finding directories, retrieving grouped translations,
 * or writing the localizations to the file.
 */
const addServiceLocalizations = async (outputServicesFile, localesFolder, i18nFilePath) => {
    try {
        // Check if translations are present for all groups in the base locale
        await checkBaseTranslations(outputServicesFile, SERVICES_BASE_TRANSLATION_FILEPATH);
        // Get grouped translations from different locales for service groups
        const localizations = await getLocales(localesFolder);
        // Write translations to combined translations file
        await fs.writeFile(i18nFilePath, JSON.stringify(localizations, null, 4));
        logger.success('Successfully added localizations');
    } catch (error) {
        logger.error(`Error adding localizations: ${error}`);
        throw new Error(error);
    }
};

module.exports = {
    addServiceLocalizations,
};
