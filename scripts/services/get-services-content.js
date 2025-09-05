const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const { logger } = require('../helpers/logger');

/**
 * @typedef {import('./type-defs').Service} Service
 * @typedef {import('./type-defs').Group} Group
 */

/**
 * Reads and retrieves blocked services and groups data from a JSON file.
 *
 * @param {string} distFilePath - The path to the JSON file containing blocked services and groups data.
 * @returns {[Service[], Group[]]} - An array containing two elements:
 *   - An array of objects representing blocked services.
 *   - An array of objects representing blocked groups.
 *
 * @throws {Error} Throws an error if there is an issue reading the file, if blocked services data is undefined,
 *   if blocked services data is not an array, or if blocked groups data is not an array.
 */
const getJsonBlockedServicesData = async (distFilePath) => {
    let blockedServices;
    let blockedGroups;

    try {
        const fileContent = await fs.readFile(distFilePath);
        const serviceObjects = JSON.parse(fileContent);
        // Extract blocked services and groups from the parsed JSON
        blockedServices = serviceObjects.blocked_services;
        blockedGroups = serviceObjects.groups;
    } catch (error) {
        logger.error(`Error while reading file ${distFilePath}`);
        throw new Error(error);
    }

    // Validate blocked services data
    if (typeof blockedServices === 'undefined') {
        throw new Error('Blocked services data is undefined');
    }
    if (!Array.isArray(blockedServices)) {
        throw new Error('Blocked services data is not an array');
    }
    if (!Array.isArray(blockedGroups)) {
        throw new Error('Blocked groups data is not an array');
    }
    if (typeof blockedGroups === 'undefined') {
        throw new Error('Blocked groups data data is undefined');
    }

    // Return an array with blocked services and groups
    return [blockedServices, blockedGroups];
};

/**
 * Gets the name of files from the folder.
 *
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<Array<string>>} - An array of file names.
 */
const getFilesInDirectory = async (folderPath) => {
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
    const sourceFileNames = await getFilesInDirectory(folderPath);
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
    getJsonBlockedServicesData,
};
