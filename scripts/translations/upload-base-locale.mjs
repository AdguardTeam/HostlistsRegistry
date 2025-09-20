/**
 * @file
 * This file is part of the HostlistsRegistry translation system.
 * It handles the upload of translation files (tags, filters, groups) to the translation service.
 *
 * The script processes locale files from the repository, converts them to the required format,
 * and prepares them for upload to the translation service.
 *
 */
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import axios from 'axios';
import path from 'path';
import FormData from 'form-data';
import { logger } from '../helpers/logger.js';
import { converter } from './converter.js';

import {
    LOCALES_UPLOAD_URL,
    BASE_LOCALE,
    LOCALES_DIR,
    TEMP_MESSAGES_FILE,
    TEMP_CONVERTED_DIR
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
    'tags.json',
    'services.json'
];

/**
 * Uploads a translation file to the translation service
 *
 * @param {TranslationData} file - File to upload
 */
const uploadLocaleFile = async (file) => {
    const localeFile = path.resolve(LOCALES_DIR, BASE_LOCALE, file);

    // create temp dir
    try {
        await fsPromises.stat(TEMP_CONVERTED_DIR);
    } catch (e) {
        await fsPromises.mkdir(TEMP_CONVERTED_DIR, { recursive: true });
    }

    const outputFile = path.resolve(TEMP_CONVERTED_DIR, file);
    const tempFile = path.resolve(TEMP_CONVERTED_DIR, TEMP_MESSAGES_FILE)

    logger.info(`Moving ${file} for ${BASE_LOCALE} locale`);
    await fsPromises.copyFile(localeFile, tempFile);

    logger.info(`Exporting ${file} for ${BASE_LOCALE} locale`);
    converter.exportFile(BASE_LOCALE, localeFile, outputFile);

    logger.info(`Uploading ${file} for ${BASE_LOCALE} locale`);

    const form = new FormData();
    form.append('format', 'json');
    form.append('language', BASE_LOCALE);
    form.append('filename', file);
    form.append('project', 'hostlists-registry');
    form.append('file', fs.createReadStream(outputFile));

    try {
        const response = await axios.post(LOCALES_UPLOAD_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        logger.info(`Upload successful: ${JSON.stringify(response.data)}`);
    } catch (error) {
        logger.error(`Error uploading: ${JSON.stringify(error.message)}`);
    }

    // clean up temporary files
    try {
        if (await fsPromises.stat(tempFile).catch(() => false)) {
            await fsPromises.unlink(tempFile);
        }

        if (await fsPromises.stat(outputFile).catch(() => false)) {
            await fsPromises.unlink(outputFile);
        }
    } catch (e) {
        logger.error(`Error cleaning up temporary files: ${e.message}`);
    }

    // remove temp dir
    try {
        await fsPromises.rmdir(TEMP_CONVERTED_DIR);
    } catch (e) {
       /* do nothing, dir does not exist */
    }
};

const upload = async () => {
    for (const file of TRANSLATION_DATA){
        await uploadLocaleFile(file)
    }
};

(async () => {
    await upload();
})();
