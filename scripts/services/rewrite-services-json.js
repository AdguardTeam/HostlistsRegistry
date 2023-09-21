const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { checkSVG } = require('./check-svg');

/**
 * Checks that all services have valid SVG icons.
 *
 * @param {Array<Object>} servicesArray - An array of service data objects.
 * @returns {boolean} True if all services have valid SVG icons; otherwise, false.
 */
const validateSvgIcons = (servicesArray) => {
    const checkedServicesSVG = servicesArray.filter((service) => checkSVG(service.icon_svg, service.id));
    return (checkedServicesSVG.length > 0);
};

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} servicesDirPath - The path to the directory containing YAML files.
 * @param {string[]} servicesNames - An array of file names to read and parse.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects of YAML content
 * from the specified files.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const getYmlFileContent = async (servicesDirPath, servicesNames) => {
    try {
        // Reads data from a yml file and writes it to an object
        const ymlDataContent = servicesNames.map(async (fileName) => {
            const ymlFileChunk = await fs.readFile(path.resolve(__dirname, servicesDirPath, fileName), 'utf-8');
            const fileDataObject = yaml.load(ymlFileChunk);
            return fileDataObject;
        });

        // Wait for all promises to resolve and return the array of parsed YAML content
        return Promise.all(ymlDataContent);
    } catch (error) {
        // If an error occurs during the process, throw an error with a specific message
        throw new Error(`Error while reading YAML file(s): ${error}`);
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
