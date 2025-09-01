/**
 * @file download-locales.js
 * This file is part of the HostlistsRegistry translation system.
 * It handles the download of translation files (tags, filters, groups) from the TwoSky translation service.
 *
 * The script downloads locale files from the translation service, converts them to the required format,
 * and saves them to the appropriate locations in the repository.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from '../helpers/logger.js';
import { converter } from './converter.js';

import { 
    LOCALES_DOWNLOAD_URL,
    LOCALES_DIR,
    TEMP_CONVERTED_FILE 
} from './locales-constants.js'

/**
 * List of locales to download
 * 
 * @typedef {LOCALES[number]} Locale
 */
const LOCALES = [
  'en', 'ru', 'ar', 'bg', 'ca', 'zh_CN', 'zh_TW', 'hr', 'da', 'nl',
  'fi', 'fr', 'de', 'he', 'hu', 'id', 'it', 'ja', 'ko', 'no',
  'fa', 'pl', 'pt', 'pt_BR', 'pt_PT', 'sr', 'sk', 'es', 'sv',
  'tr', 'uk', 'vi', 'be', 'sl'
];

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

        fs.writeFileSync(TEMP_MESSAGES_FILE, response.data);
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
        logger.warning(`Skipping ${fileConfig.name} for ${locale} due to download error`);
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

    if (!fs.existsSync(localeDir)) {
        fs.mkdirSync(localeDir, { recursive: true });
    }

    // Parse the downloaded file
    logger.info(`Parsing ${fileConfig.name} for ${locale} locale`);
    converter.importFile(locale, TEMP_MESSAGES_FILE, TEMP_CONVERTED_FILE, fileConfig.prefix);

    // Move the file to the destination
    logger.info(`Moving ${fileConfig.name} for ${locale} locale to ${localeDir}`);
    fs.copyFileSync(TEMP_CONVERTED_FILE, path.join(localeDir, fileConfig.name));

    // Handle special cases for es and pt locales
    if (locale === 'es') {
        const esESDir = path.join(LOCALES_DIR, 'es_ES');
        if (!fs.existsSync(esESDir)) {
            fs.mkdirSync(esESDir, { recursive: true });
        }
        logger.info(`Copying ${fileConfig.name} for es_ES locale`);
        fs.copyFileSync(TEMP_CONVERTED_FILE, path.join(esESDir, fileConfig.name));
    }

    if (locale === 'pt') {
        const ptPTDir = path.join(LOCALES_DIR, 'pt_PT');
        if (!fs.existsSync(ptPTDir)) {
            fs.mkdirSync(ptPTDir, { recursive: true });
        }
        logger.info(`Copying ${fileConfig.name} for pt_PT locale`);
        fs.copyFileSync(TEMP_CONVERTED_FILE, path.join(ptPTDir, fileConfig.name));
    }

    // Clean up temporary files
    if (fs.existsSync(TEMP_MESSAGES_FILE)) {
        fs.unlinkSync(TEMP_MESSAGES_FILE);
    }
    if (fs.existsSync(TEMP_CONVERTED_FILE)) {
        fs.unlinkSync(TEMP_CONVERTED_FILE);
    }
}

/**
 * Main function to download and process all translation files
 */
async function downloadLocales() {
  logger.info('Starting download of translation files');

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
