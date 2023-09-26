const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { validateSvgIcons } = require('./validate-svg-icons');

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} servicesDir - The path to the directory containing YAML files.
 * @param {string[]} servicesNames - An array of file names to read and parse.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of objects of YAML content.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const getYmlFileContent = async (servicesDir, servicesNames) => {
    try {
        // Reads data from a yml file and writes it to an object
        const ymlDataContent = servicesNames.map(async (fileName) => {
            const ymlFileChunk = await fs.readFile(path.resolve(__dirname, servicesDir, fileName), 'utf-8');
            const fileDataObject = yaml.load(ymlFileChunk);
            return fileDataObject;
        });

        // Wait for all promises to resolve and return the array of parsed YAML content
        return Promise.all(ymlDataContent);
    } catch (error) {
        // If an error occurs during the process, throw an error
        throw new Error('Error while reading YAML file', error);
    }
};

/**
 * Builds a services.json file from the services folder.
 *
 * @param {string} servicesDir - The path to the services folder.
 * @param {string} servicesJSON - The path to the services.json file to write.
 * @throws {Error} If there are issues reading or writing files, or if SVG validation fails.
 */
const rewriteServicesJSON = async (servicesDir, servicesJSON) => {
    // Array with all service names in the services folder.
    const ymlFileNames = await fs.readdir(servicesDir);
    // Array with YML files content.
    const ymlDataObjects = await getYmlFileContent(servicesDir, ymlFileNames);
    // Validate SVG icons. If the svg icon is not valid, an error is thrown.
    validateSvgIcons(ymlDataObjects);
    // Object to store the services.json file content.
    const servicesData = {};
    // Sort services from YML data.
    const sortedServicesData = ymlDataObjects.sort();
    // Write the sorted services array into the blocked_services key.
    servicesData.blocked_services = sortedServicesData;
    // Rewrite services.json.
    await fs.writeFile(servicesJSON, JSON.stringify(servicesData, null, 2));
};

module.exports = {
    rewriteServicesJSON,
};
