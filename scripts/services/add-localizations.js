const { promises: fs } = require('fs');
const { existsSync } = require('fs');
const path = require('path');
const { logger } = require('../helpers/logger');

/**
 * @typedef {import('./type-defs')} categoryLocalesTranslate
 * @typedef {import('./type-defs')} groupedFileObjects
 */

/**
 * Returns only directories names from folder
 *
 * @param {string} folderPath folder path
 * @returns {Array<string>} only directories names in folder
 */
const getDirNames = async (folderPath) => (await fs.readdir(folderPath, { withFileTypes: true }))
    .filter((folderFile) => folderFile.isDirectory())
    .map((folderFile) => folderFile.name);

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
 * @param {string[]} directories - An array of directory names where files for groups exist.
 * @returns {Promise<object>} A promise that resolves to an object representing grouped translations.
 *
 * @throws {Error} If there is an issue reading the file or parsing its content.
 */
const getGroupedTranslations = async (localesFolder) => {
    try {
        // Get an array of locale directories in the base folder
        const localesDirectories = await getDirNames(localesFolder);
        // Collect translations asynchronously from each directory
        const collectTranslations = localesDirectories.map(async (directory) => {
            // File path to the translation file
            const translationFilePath = path.join(localesFolder, directory, 'services.json');
            // Check if the translation file exists
            if (await existsSync(translationFilePath)) {
                // Read and parse the translation content
                const translationContent = JSON.parse(await fs.readFile(translationFilePath));
                // Group translations by id, locale and use (name, description etc.)
                return groupFileContentByTranslations(translationContent, directory);
            }
            return null;
        });
        const translations = await Promise.all(collectTranslations);
        // Filter out null values (directories without translation files)
        const existingTranslations = translations.filter((translation) => translation !== null);
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
        categoryLocalesTranslate.groups = await getGroupedTranslations(
            localesFolder,
        );
        return categoryLocalesTranslate;
    } catch (error) {
        logger.error(`Error getting locales: ${error}`);
        throw new Error(error);
    }
};

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories
 * and writes the localizations to a specified file path.
 *
 * @param {string} localesFolder - The base path to the folder containing locale directories.
 * @param {string} i18nFilePath - The file path where the localizations will be written.
 * @returns {Promise<void>} A promise that resolves when the localizations are successfully written to the file.
 *
 * @throws {Error} If there is an issue finding directories, retrieving grouped translations,
 * or writing the localizations to the file.
 */
const addServiceLocalizations = async (localesFolder, i18nFilePath) => {
    try {
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
