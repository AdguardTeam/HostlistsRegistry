/**
 * @file upload-locales.js
 * This file is part of the HostlistsRegistry translation system.
 * It handles the upload of translation files (tags, filters, groups) to the TwoSky translation service.
 *
 * The script processes locale files from the repository, converts them to the required format,
 * and prepares them for upload to the translation service.
 *
 */
import fs from 'fs';
import { logger } from '../helpers/logger.js';
import { converter } from './converter.js';

import {
    LOCALES_UPLOAD_URL,
    BASE_LOCALE,
    LOCALES_DIR,
    TEMP_MESSAGES_FILE
} from './locales-constants.js'

/**
 * List of files with translations
 * that belongs to the hostlists-registry content
 * 
 * @typedef {typeof TRANSLATION_DATA[number]} TranslationData
 */
const TRANSLATION_DATA = [
    'groups.json',
    'filters.json',
    'tags.json'
];

/**
 * Uploads a translation file to the TwoSky translation service
 * 
 * @param {string} baseLocale - Base locale
 * @param {TranslationData} file - File to upload
 */
const uploadLocale = async (baseLocale, file) => {
    const localeFile = `${LOCALES_DIR}/${baseLocale}/${file}`;
    const outputFile = `./${file}`;

    logger.info(`Moving ${file} for ${baseLocale} locale`);
    fs.copyFileSync(localeFile, TEMP_MESSAGES_FILE);

    logger.info(`Exporting ${file} for ${baseLocale} locale`);
    converter.exportFile(baseLocale, localeFile, outputFile);

    logger.info(`Uploading ${file} for ${baseLocale} locale`);

    const form = new FormData();
    form.append('format', 'json');
    form.append('language', baseLocale);
    form.append('filename', file);
    form.append('project', 'hostlists-registry');
    form.append('file', fs.createReadStream(outputFile));

    try {
        const response = await axios.post(`${LOCALES_UPLOAD_URL}`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        logger.info('Upload successful:', response.data);
    } catch (error) {
        logger.error('Error uploading:', error.message);
    }

    // Clean up temporary files
    fs.unlinkSync(TEMP_MESSAGES_FILE);
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }
}

TRANSLATION_DATA.forEach((file) => {
    uploadLocale(BASE_LOCALE, file);
});