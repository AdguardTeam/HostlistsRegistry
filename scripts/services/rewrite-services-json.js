const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { checkSVG } = require('./check-svg');

/**
 * Builds a services.json file from the services folder.
 *
 * @param {string} servicesDir - The path to the services folder.
 * @param {string} servicesJSON - The path to the services.json file to write.
 * @throws {Error} If there are issues reading or writing files, or if SVG validation fails.
 */
const rewriteServicesJSON = async (servicesDir, servicesJSON) => {
    // Variable to store the JSON object.
    const servicesData = [];

    // Array with all service names in the services folder.
    const fileNames = await fs.readdir(servicesDir);

    /**
     * Reads service data from a YML file and pushes it into the servicesData array.
     *
     * @param {string} fileName - The name of the YML file to read.
     * @throws {Error} If there is an error while reading the YML file.
     */
    const readServiceData = async (fileName) => {
        try {
            const fileData = await fs.readFile(path.resolve(__dirname, servicesDir, fileName), 'utf8');
            const fileDataObject = yaml.load(fileData);
            servicesData.push(fileDataObject);
        } catch (er) {
            throw Error(`Error while reading YML file: "${fileName}"`, er);
        }
    };

    // Read data from YML files.
    const getServicesData = fileNames.map((fileName) => readServiceData(fileName));
    await Promise.all(getServicesData);

    /**
     * Checks that all services have valid SVG icons.
     *
     * @param {Array<Object>} servicesArray - An array of service data objects.
     * @returns {boolean} True if all services have valid SVG icons; otherwise, false.
     */
    const checkValidSVG = (servicesArray) => {
        const checkedServicesSVG = servicesArray.filter((service) => {
            const servicesSVG = service.icon_svg;
            const serviceID = service.id;
            return checkSVG(serviceID, servicesSVG);
        });
        if (checkedServicesSVG.length > 0) {
            return true;
        }
        return false;
    };

    // Validate SVG icons.
    checkValidSVG(servicesData);

    // Object to store the services.json file content.
    const services = {};

    // Sort the servicesData array by ID.
    const sortedServicesData = servicesData.sort((a, b) => a.id.localeCompare(b.id));

    // Write the sorted services array into the blocked_services key.
    services.blocked_services = sortedServicesData;

    // Rewrite services.json.
    await fs.writeFile(servicesJSON, JSON.stringify(services, null, 2));
};

module.exports = {
    rewriteServicesJSON,
};
