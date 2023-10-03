const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const { validateSvgIcons } = require('./validate-svg-icons');

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} filePath - The path to the directory containing YAML files.
 * @param {string[]} serviceFilenames - An array of file names to read and parse.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of objects of YAML content.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const getServiceFilesContent = async (filePath, serviceFilenames) => {
    try {
        // Reads data from a yml file and writes it to an object
        const serviceFileContent = serviceFilenames.map(async (fileName) => {
            const fileChunk = await fs.readFile(
                (path.resolve(__dirname, filePath, `${fileName}${YML_FILE_EXTENSION}`)),
                'utf-8',
            );
            const fileData = yaml.load(fileChunk);
            return fileData;
        });

        // Wait for all promises to resolve and return the array of parsed YAML content
        return Promise.all(serviceFileContent);
    } catch (error) {
        // If an error occurs during the process, throw an error
        throw new Error('Error while reading YAML files', error);
    }
};

/**
 * Builds a services.json file from the services folder.
 *
 * @param {string} inputDirPath - The path to the services folder.
 * @param {string} resultFilePath - The path to the services.json file to write.
 * @param {Array<string>} ymlFileNames - Array of normalized yml file names.
 * @throws {Error} If there are issues reading or writing files, or if SVG validation fails.
 */
const createBlockedServicesFile = async (inputDirPath, resultFilePath, ymlFileNames) => {
    // Array with YML files content.
    const servicesDataObjects = await getServiceFilesContent(inputDirPath, ymlFileNames);
    // Validate SVG icons. If the svg icon is not valid, an error is thrown.
    validateSvgIcons(servicesDataObjects);
    // Object to store the services.json file content.
    const servicesData = {};
    // Sort services from YML data.
    const sortedServicesData = servicesDataObjects.sort();
    // Write the sorted services array into the blocked_services key.
    servicesData.blocked_services = sortedServicesData;
    // Rewrite services.json.
    await fs.writeFile(resultFilePath, JSON.stringify(servicesData, null, 2));
};

module.exports = {
    createBlockedServicesFile,
};
