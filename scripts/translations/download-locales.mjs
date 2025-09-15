/**
 * @file
 * This file is part of the HostlistsRegistry translation system.
 * It handles the download of translation files (tags, filters, groups) from the translation service.
 *
 * The script downloads locale files from the translation service, converts them to the required format,
 * and saves them to the appropriate locations in the repository.
 */

import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from '../helpers/logger.js';
import { converter } from './converter.js';

import {
    LOCALES_DOWNLOAD_URL,
    LOCALES_DIR,
    TEMP_CONVERTED_FILE,
    TEMP_MESSAGES_FILE,
    TWOSKY_FILE_PATH
} from './locales-constants.js'

/**
 * Get locales from .twosky.json configuration
 *
 * @returns {Promise<string[]>} Array of locale codes
 * @throws {Error} If .twosky.json is missing or invalid
 */
async function getLocalesFromConfig() {
    try {
        const data = await fs.readFile(TWOSKY_FILE_PATH, 'utf8');
        const twoskyConfig = JSON.parse(data);
        if (
            !Array.isArray(twoskyConfig)
            || twoskyConfig.length === 0
            || !twoskyConfig[0].languages
        ) {
            throw new Error('Invalid .twosky.json format: missing languages configuration');
        }

        return Object.keys(twoskyConfig[0].languages);
    } catch (error) {
        // Rethrow with more context instead of falling back to defaults
        throw new Error(`Failed to load locales from .twosky.json: ${error.message}`);
    }
}

/**
 * List of locales to download
 * @typedef {typeof LOCALES[number]} Locale
 */
let LOCALES;

/**
 * Translation files configuration
 *
 * @typedef {typeof TRANSLATION_FILES[number]} TranslationFileConfig
 */
const TRANSLATION_FILES = [
    {
        name: 'tags.json',
        filename: 'tags.json',
        prefix: 'hostlisttag.'
    },
    {
        name: 'filters.json',
        filename: 'hostlists.json',
        prefix: 'hostlist.'
    },
    {
        name: 'groups.json',
        filename: 'groups.json',
        prefix: 'hostlistgroup.'
    },
    {
        name: 'services.json',
        filename: 'services.json',
        prefix: 'servicesgroup.'
    }
];

/**
 * Downloads a file from the translation service
 *
 * @param {Locale} locale - locale to download
 * @param {string} filename - filename on the server
 * @returns {Promise<boolean>} - whether the download was successful
 */
async function downloadFile(locale, filename) {
    try {
        const response = await axios.get(LOCALES_DOWNLOAD_URL, {
            params: {
                format: 'strings',
                language: locale,
                filename: filename,
                project: 'hostlists-registry'
            },
            responseType: 'text'
        });

        await fs.writeFile(TEMP_MESSAGES_FILE, response.data);
        return true;
    } catch (error) {
        logger.error(`Error downloading ${filename} for ${locale}: ${error.message}`);
        return false;
    }
}

/**
 * Processes a translation file for a specific locale
 *
 * @param {Locale} locale - locale to process
 * @param {TranslationFileConfig} fileConfig - file configuration
 */
async function processTranslationFile(locale, fileConfig) {
    logger.info(`Download ${fileConfig.name} for ${locale} locale`);

    const success = await downloadFile(locale, fileConfig.filename);
    if (!success) {
        logger.warn(`Skipping ${fileConfig.name} for ${locale} due to download error`);
        return;
    }

    // Handle special case for zh_CN
    let destinationLocale = locale;

    if (locale === 'zh_CN') {
        logger.info(`Change ${locale} destination dir to zh`);
        destinationLocale = 'zh';
    }

    // Ensure the locale directory exists
    const localeDir = path.join(LOCALES_DIR, destinationLocale);

    try {
        await fs.stat(localeDir);
    } catch (e) {
        await fs.mkdir(localeDir, { recursive: true });
    }

    // Parse the downloaded file
    logger.info(`Parsing ${fileConfig.name} for ${locale} locale`);
    converter.importFile(locale, TEMP_MESSAGES_FILE, TEMP_CONVERTED_FILE, fileConfig.prefix);

    // Move the file to the destination
    logger.info(`Moving ${fileConfig.name} for ${locale} locale to ${localeDir}`);
    await fs.copyFile(TEMP_CONVERTED_FILE, path.join(localeDir, fileConfig.name));

    // Handle special cases for pt locale
    if (locale === 'pt') {
        const ptPTDir = path.join(LOCALES_DIR, 'pt_PT');
        try {
            await fs.stat(ptPTDir);
        } catch (e) {
            await fs.mkdir(ptPTDir, { recursive: true });
        }
        logger.info(`Copying ${fileConfig.name} for pt_PT locale`);
        await fs.copyFile(TEMP_CONVERTED_FILE, path.join(ptPTDir, fileConfig.name));
    }

    // Clean up temporary files
    try {
        await fs.unlink(TEMP_MESSAGES_FILE).catch(() => {});
        await fs.unlink(TEMP_CONVERTED_FILE).catch(() => {});
    } catch (e) {
        logger.error(`Error cleaning up temporary files: ${e.message}`);
    }
}

/**
 * Main function to download and process all translation files
 */
async function downloadLocales() {
  logger.info('Starting download of translation files');

  // Initialize LOCALES
  LOCALES = await getLocalesFromConfig();

  for (const fileConfig of TRANSLATION_FILES) {
    for (const locale of LOCALES) {
      await processTranslationFile(locale, fileConfig);
    }
  }

  logger.info('Import finished');
}

// Execute the download
downloadLocales().catch(error => {
  logger.error(`Error in download process: ${error.message}`);
  process.exit(1);
});
