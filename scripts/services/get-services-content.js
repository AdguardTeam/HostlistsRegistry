const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const { logger } = require('../helpers/logger');

/**
 * @typedef {require('./type-defs').Service} Service
 */

/**
 * Returns the blocked services data from a JSON file.
 *
 * @param {string} distFilePath - The path to the json file.
 * @returns {Service[]} - Array of blocked services objects.
 * @throws {Error} - If the file cannot be read or parsed,
 * if the blocked services data is undefined or not an array.
 */
const getJsonBlockedServices = async (distFilePath) => {
    let blockedServices;
    try {
        const fileContent = await fs.readFile(distFilePath);
        const serviceObjects = JSON.parse(fileContent);
        blockedServices = serviceObjects.blocked_services;
    } catch (error) {
        logger.error(`Error while reading file ${distFilePath}`);
        throw new Error(error);
    }

    if (typeof blockedServices === 'undefined') {
        throw new Error('Blocked services data is undefined');
    }

    if (!Array.isArray(blockedServices)) {
        throw new Error('Blocked services data is not an array');
    }

    return blockedServices;
};

/**
 * Gets the name of files from the folder.
 *
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<Array<string>>} - An array of file names.
 */
const getDirFileNames = async (folderPath) => {
    // get all dir names from services folder
    const fileNames = await fs.readdir(folderPath);
    // get the file names without its extension
    const fileBaseNames = fileNames.map((file) => path.parse(file).name);
    // return sorted array
    return fileBaseNames.sort();
};

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} folderPath - The path to the directory containing YAML files.
 * @returns {Promise<Service[]>} A promise that resolves to an array of objects of YAML content.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const getYmlSourcesBlockedServices = async (folderPath) => {
    const sourceFileNames = await getDirFileNames(folderPath);
    const invalidYmlFiles = [];
    // Reads data from a yml file and writes it to an object
    const sourceFileContent = await Promise.all(
        sourceFileNames.map(async (fileName) => {
            try {
                // Set the path to the file
                const serviceFilePath = path.resolve(__dirname, folderPath, `${fileName}${YML_FILE_EXTENSION}`);
                // Read the file and parse the content
                const fileChunk = await fs.readFile(serviceFilePath, 'utf-8');
                const fileData = yaml.load(fileChunk);
                return fileData;
            } catch (error) {
                // Collect the names of the invalid files
                invalidYmlFiles.push(fileName);
                return null;
            }
        }),
    );
    // If there are invalid files, throw an error
    if (invalidYmlFiles.length > 0) {
        throw new Error(`Error while reading YML files: ${invalidYmlFiles.join(', ')}`);
    }
    // Return the array of objects with YML files content if there are no errors
    return sourceFileContent;
};

module.exports = {
    getYmlSourcesBlockedServices,
    getJsonBlockedServices,
};
