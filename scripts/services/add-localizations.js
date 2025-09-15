const { promises: fs, existsSync, readFileSync } = require('fs');
const path = require('path');
const { logger } = require('../helpers/logger');
const { sortByFirstKeyName } = require('../helpers/helpers');
const { translationsCollectionSchema, servicesI18Schema, translationSchema } = require('./zod-schemas');

const SERVICES_TRANSLATION_FILE = 'services.json';
const BASE_LOCALE_DIR = 'locales/en';
const SERVICES_BASE_TRANSLATION_FILEPATH = path.join(BASE_LOCALE_DIR, SERVICES_TRANSLATION_FILE);

/**
 * Returns only directories names from folder
 *
 * @param {string} folderPath folder path
 * @returns {Promise<Array<string>>} only directories names in folder
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
 * @typedef {object} GroupID
 * @property {string} id - The identifier of the group.
 */

/**
 * @typedef {object} GroupLocale
 * @property {string} locale - The locale of the group.
 */

/**
 * @typedef {object} GroupTranslation
 * @property {string} name - The name translation.
 */

/**
 * @typedef {{
 *   GroupID: {
 *     GroupLocale: {
 *         GroupTranslation
 *     }
 *   }
 * }} GroupTranslationByLocale
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
 * @typedef {{ key: string}} Translation
 * @example { "servicesgroup.cdn.name": "Content Delivery Network" }
 */

/**
 * @typedef {Translation[]} TranslationsCollection
 *
 * @example
 * [
 *   {
 *     "servicesgroup.cdn.name": "Content Delivery Network"
 *   },
 *   {
 *     "servicesgroup.dating.name": "Dating Services"
 *   },
 * ]
 */

/**
 * Groups file content by translations for a specific locale.
 *
 * @param {TranslationsCollection} fileObjects - An array of objects representing file content.
 * @param {string} locale - The locale for which to group the file objects.
 * Locale corresponds to the name of the directory from which the information is taken
 * @returns {GroupTranslationByLocale} An object containing grouped translations by component id,
 * sign (name, description etc.) and locale.
 * @throws {Error} If there is an issue.
 */
const groupFileContentByTranslations = (fileObjects, locale) => {
    // fileObjects - schema validation
    translationsCollectionSchema.parse(fileObjects);
    // Initialize an empty object to store grouped translations
    const groupedFileObjects = {};
    const invalidKeys = [];
    fileObjects.forEach((fileObject) => {
        // Initialize empty objects for translation, locales, and component locales (groups id)
        const translate = {};
        const localesTranslate = {};
        const componentLocalesTranslate = {};
        // { "servicesgroup.cdn.name": "Cdn" }
        Object.entries(fileObject).forEach(([key, value]) => {
            // Skip TODO comments
            if (value.includes('TODO:')) {
                return;
            }
            // Destructure the key into category, id, and sign (name, description, etc.)
            // servicesgroup.cdn.name --> id - cdn , sign - name
            const [prefix, id, sign] = key.split('.');
            // Check if id and sign are present
            if (prefix !== 'servicesgroup' || !id || sign !== 'name') {
                invalidKeys.push(key);
                return;
            }
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

    if (invalidKeys.length > 0) {
        throw new Error(`Invalid key format: ${invalidKeys.join(', ')}. Expected format: 'servicesgroup.id.name'`);
    }

    return groupedFileObjects;
};
/**
 * @typedef {{ name: string }} TranslationName
 */

/**
 * @typedef {{ [key: string]: TranslationName }} TranslationLocale
 */

/**
 * @typedef {{ [key: string]: { [key: string]: TranslationLocale } }} TranslationId
 */

/**
 * @typedef {{ [key: string]: TranslationId }} groupedTranslations
 */

/**
 * Asynchronously reads file content from specified directories, groups the content by translations,
 * and returns an object representing the grouped translations.
 *
 * @param {string} localesFolder - The base path to the folder containing the directories.
 * @returns {groupedTranslations} A promise that resolves to an object representing grouped translations.
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
                const groupedTranslations = groupFileContentByTranslations(translationContent, directory);
                existingTranslations.push(groupedTranslations);
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
 * @typedef {{groups: GroupTranslationByLocale}} categoryLocalesTranslate
 * @property {GroupTranslationByLocale} - An object containing grouped translations
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
 * Check if all translations are present in the base locale.
 * If translations are missing, add placeholder to the base locale file.
 *
 * @param {string} baseTranslationsPath - Path to the base translations file
 * @param {Map<string, Set<string>>} serviceGroupsTranslations - Map of service groups to translations
 * @returns {Promise<void>}
 */
async function checkBaseTranslations(baseTranslationsPath, serviceGroupsTranslations) {
    try {
        // Read the base translations file
        let baseTranslationsContent;
        let baseTranslations = [];

        try {
            baseTranslationsContent = await fs.readFile(baseTranslationsPath, 'utf8');
            baseTranslations = JSON.parse(baseTranslationsContent);

            // Validate that baseTranslations is an array
            if (!Array.isArray(baseTranslations)) {
                logger.warning(`Base translations file is not an array, converting to array: ${baseTranslationsPath}`);
                // If it's not an array but an object, convert it to an array with one item
                if (typeof baseTranslations === 'object' && baseTranslations !== null) {
                    baseTranslations = [baseTranslations];
                } else {
                    baseTranslations = [];
                }
            }
        } catch (error) {
            // If the file doesn't exist or has invalid JSON, start with an empty array
            logger.warning(`Could not read base translations file or invalid JSON: ${error.message}`);
            baseTranslations = [];
        }

        // Create a map of all translation keys in the base locale
        const baseTranslationKeys = new Set();

        // Validate each translation object in the array
        baseTranslations.forEach((translationObj) => {
            try {
                // Validate the translation object against the schema
                const result = translationSchema.safeParse(translationObj);

                if (!result.success) {
                    logger.error(`Invalid translation object in base locale: ${JSON.stringify(result.error.errors)}`);
                    return;
                }

                // Add the key to the set of known keys
                const key = Object.keys(translationObj)[0];
                baseTranslationKeys.add(key);
            } catch (error) {
                logger.error(`Error validating translation object: ${error.message}`);
            }
        });

        // Check if all required translations are present in the base locale
        const missingTranslations = [];
        let translationsAdded = false;

        // [serviceGroup, translations]
        Array.from(serviceGroupsTranslations.entries()).forEach(([serviceGroup, translations]) => {
            Array.from(translations).forEach((translation) => {
                if (!baseTranslationKeys.has(translation)) {
                    missingTranslations.push(`${translation} (${serviceGroup})`);

                    // Create a new translation object with a placeholder value
                    const newTranslation = {};
                    newTranslation[translation] = `[TODO: Add translations] ${serviceGroup}`;

                    // Add it to the base translations array
                    baseTranslations.push(newTranslation);
                    translationsAdded = true;

                    logger.warning(`Added missing translation placeholder: ${translation} for group ${serviceGroup}`);
                }
            });
        });

        // If translations were added, write the updated file
        if (translationsAdded) {
            // Ensure the directory exists
            const dir = path.dirname(baseTranslationsPath);
            await fs.mkdir(dir, { recursive: true });

            // Sort the translations before writing them
            const sortedTranslations = sortByFirstKeyName(baseTranslations);

            // Write the updated translations back to the file
            await fs.writeFile(
                baseTranslationsPath,
                JSON.stringify(sortedTranslations, null, 2),
                'utf8',
            );

            logger.success(
                `Updated base translations file with ${missingTranslations.length} new placeholder translations`,
            );
        }

        if (missingTranslations.length > 0) {
            logger.warning(
                `Added placeholder for missing translations in base locale: ${missingTranslations.join(', ')}`,
            );
        } else {
            logger.success('All translations are present in the base locale');
        }
    } catch (error) {
        logger.error(`Error when checking for translations in base locale: ${error.message}`);
        throw error;
    }
}

/**
 * Asynchronously retrieves grouped translations for different locales based on specified directories
 * and writes them to a combined translations file.
 *
 * @param {string} outputServicesFile - Path to the file containing service data.
 * @param {string} localesFolder - Path to the folder containing locale-specific translations.
 * @param {string} i18nFilePath - Path to the file where combined translations will be written.
 * @returns {Promise<void>} - A promise that resolves once the operation is complete.
 */
const addServiceLocalizations = async (outputServicesFile, localesFolder, i18nFilePath) => {
    try {
        // Read service data
        const servicesData = JSON.parse(await fs.readFile(outputServicesFile));
        const { groups } = servicesData;

        // Create a map of service groups to translations
        const serviceGroupsTranslations = new Map();
        groups.forEach((group) => {
            const translationKey = `servicesgroup.${group.id}.name`;
            if (!serviceGroupsTranslations.has(group.id)) {
                serviceGroupsTranslations.set(group.id, new Set());
            }
            serviceGroupsTranslations.get(group.id).add(translationKey);
        });

        // Check if translations are present for all groups in the base locale
        // If not, placeholders will be added automatically
        await checkBaseTranslations(SERVICES_BASE_TRANSLATION_FILEPATH, serviceGroupsTranslations);

        // Get grouped translations from different locales for service groups
        const localizations = await getLocales(localesFolder);

        // Validate the localizations against the schema
        try {
            servicesI18Schema.parse(localizations);
        } catch (error) {
            logger.error(`Error validating localizations: ${error.message}`);
            logger.error(JSON.stringify(error.errors || [], null, 2));
            throw error;
        }

        // Write translations to combined translations file
        await fs.writeFile(i18nFilePath, `${JSON.stringify(localizations, null, 4)}\n`);
        logger.success('Successfully added localizations');
    } catch (error) {
        logger.error(`Error adding localizations: ${error.message}`);
        throw error;
    }
};

module.exports = {
    addServiceLocalizations,
};
