const { promises: fs } = require('fs');
const path = require('path');

/**
 * Returns only directories names from folder
 *
 * @param {string} folderPath folder path
 * @returns {Array<string>} only directories names in folder
 */
const getDirFileNames = async (folderPath) => (await fs.readdir(folderPath, { withFileTypes: true }))
    .filter((folderFile) => folderFile.isDirectory())
    .map((folderFile) => folderFile.name);

/**
 * Finds directories within a specified folder that contain a specific target file.
 *
 * @param {string} folderPath - The path to the folder to search within.
 * @param {string} targetFile - The name of the target file to search for.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of directory names
 * where the target file is found.
 * @throws {Error} If there is an issue accessing the file system or checking file existence.
 */
const findDirectoriesWithFile = async (folderPath, targetFile) => {
    const dirNames = await getDirFileNames(folderPath);
    const results = await Promise.all(
        dirNames.map(async (dirName) => {
            const dirPath = path.join(folderPath, dirName, targetFile);
            const isExist = async (filePath) => fs.access(filePath, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false);
            if (await isExist(dirPath)) {
                return dirName;
            }
            return null;
        }),
    );
    return results.filter((result) => result !== null);
};

/**
 * @typedef {Object.<string, {
 *   [locale: string]: {
 *     [id: string]: {
 *       sign: string;
 *     };
 *   };
 * }>} groupedFileObjects
 * Example:
 * {
 *    '123': {
 *        'en': { 'sign': 'value1' },
 *        'es': { 'sign': 'value3' }
 *    },
 *    '456': {
 *        'en': { 'sign': 'value2' },
 *        'fr': { 'sign': 'value4' }
 *    },
 *    // ...
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
 * @example
 * const fileObjects = [{ 'category.123.sign': 'value1' }, { 'category.456.sign': 'value2' }];
 * const locale = 'en';
 * const groupedFileObjects = groupFileObjectsByComponentAndSign(fileObjects, locale);
 * // groupedFileObjects: { '123': { 'en': { 'sign': 'value1' } }, '456': { 'en': { 'sign': 'value2' } } }
 */

const groupFileContentByTranslations = (fileObjects, locale) => {
    const groupedFileObjects = {};

    fileObjects.forEach((fileObject) => {
        const translate = {};
        const localesTranslate = {};
        const componentLocalesTranslate = {};

        Object.entries(fileObject).forEach(([key, value]) => {
            const [, id, sign] = key.split('.');
            translate[sign] = value;
            localesTranslate[locale] = translate;
            componentLocalesTranslate[id] = localesTranslate;
        });

        Object.assign(groupedFileObjects, componentLocalesTranslate);
    });

    return groupedFileObjects;
};
/**
 * Asynchronously reads file content from specified directories, groups the content by translations,
 * and returns an object representing the grouped translations.
 *
 * @param {string} baseFolder - The base path to the folder containing the directories.
 * @param {string[]} directories - An array of directory names where files for groups exist.
 * @param {string} targetFile - The name of the target file to read.
 * @returns {Promise<object>} A promise that resolves to an object representing grouped translations.
 *
 * @throws {Error} If there is an issue reading the file or parsing its content.
 */
const getGroupedTranslations = async (baseFolder, directories, targetFile) => {
    try {
        const promises = directories.map(async (directory) => {
            const filePath = path.join(baseFolder, directory, targetFile);
            const fileContent = JSON.parse(await fs.readFile(filePath));
            return groupFileContentByTranslations(fileContent, directory);
        });

        const results = await Promise.all(promises);

        return results.reduce((acc, obj) => {
            Object.entries(obj).forEach(([key, value]) => {
                acc[key] = { ...acc[key], ...value };
            });
            return acc;
        }, {});
    } catch (error) {
        throw new Error(`Error getting grouped translations: ${error.message}`);
    }
};

/**
 * @typedef {object} categoryLocalesTranslate
 * @property {object} groups - An object containing grouped translations for different categories and locales.
 * Example:
 * {
 *  groups: {
 *    '123': {
 *        'en': { 'sign': 'value1' },
 *        'es': { 'sign': 'value3' }
 *    },
 *    '456': {
 *        'en': { 'sign': 'value2' },
 *        'fr': { 'sign': 'value4' }
 *    },
 *    // ...
 *  }
 * }
 */

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories.
 *
 * @param {string} baseLocalesFolder - The base path to the folder containing locale directories.
 * @param {string} targetServiceFile - The name of the service file used to identify directories.
 * @returns {categoryLocalesTranslate} A promise that resolves to an object representing grouped translations
 * for different locales.
 *
 * @throws {Error} If there is an issue finding directories or retrieving grouped translations.
 */
const getLocales = async (baseLocalesFolder, targetServiceFile) => {
    try {
        const directoriesWithFile = await findDirectoriesWithFile(baseLocalesFolder, targetServiceFile);
        const categoryLocalesTranslate = {};
        categoryLocalesTranslate.groups = await getGroupedTranslations(
            baseLocalesFolder,
            directoriesWithFile,
            targetServiceFile,
        );

        return categoryLocalesTranslate;
    } catch (error) {
        throw new Error(`Error getting locales: ${error.message}`);
    }
};

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories
 * and writes the localizations to a specified file path.
 *
 * @param {string} baseLocalesFolder - The base path to the folder containing locale directories.
 * @param {string} targetServiceFile - The name of the service file used to identify directories.
 * @param {string} i18nFilePath - The file path where the localizations will be written.
 * @returns {Promise<void>} A promise that resolves when the localizations are successfully written to the file.
 *
 * @throws {Error} If there is an issue finding directories, retrieving grouped translations,
 * or writing the localizations to the file.
 */
const addServicesLocalizations = async (baseLocalesFolder, targetServiceFile, i18nFilePath) => {
    try {
        const localizations = await getLocales(baseLocalesFolder, targetServiceFile);
        await fs.writeFile(i18nFilePath, JSON.stringify(localizations, null, 4));
    } catch (error) {
        throw new Error(`Error adding localizations: ${error.message}`);
    }
};

module.exports = {
    addServicesLocalizations,
};
