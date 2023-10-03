const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const servicesDir = path.resolve(__dirname, '../../services/');

/**
 * Converts a service name to lowercase and replaces special characters.
 *
 * @param {string} serviceName - The service name to be normalized.
 * @returns {string} The normalized service name.
 */
const normalizeFileName = (serviceName) => serviceName.toLowerCase().replace(/[^a-z0-9.]/g, '');

/**
 * Gets blocked services data from services file.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<object[]|null>} - Array of blocked services objects.
 * Returns `null` if there's an error during the process.
 */
const getBlockedServicesData = async (filePath) => {
    try {
        const fileContent = await fs.readFile(filePath);
        const serviceObjects = JSON.parse(fileContent);
        return serviceObjects.blocked_services;
    } catch (error) {
        console.error('Error while reading services.json', error);
        return null;
    }
};

/**
 * Gets the normalized id of blocked services.
 *
 * @param {Promise<Array<object>>} serviceData - An array of blocked services objects.
 * @returns {Promise<Array<string>>} - An array of normalized blocked service id.
 */
const getBlockedServicesNames = (serviceData) => serviceData.map(({ id }) => normalizeFileName(id)).sort();

/**
 * Write removed services objects into YML files.
 *
 * @param {Array<object>} removedObjects - Array of objects that should be written in separate YML files.
 */
const writeRemovedServices = async (removedObjects) => {
    if (removedObjects.length === 0) {
        return;
    }
    const [removedObject, ...restObjects] = removedObjects;
    await fs.writeFile(
        path.join(`${servicesDir}/${removedObject.id}${YML_FILE_EXTENSION}`),
        yaml.dump(removedObject, { lineWidth: -1 }),
    );
    if (removedObjects.length > 1) {
        await writeRemovedServices(restObjects);
    }
};

/**
 * Checks for removed services and rewrites YAML files if necessary.
 *
 * @param {string} filePath - The path to the JSON file containing services data.
 * @param {Array<string>} servicesFileNames - Array of normalized yml file names.
 */
const restoreRemovedInputServices = async (filePath, servicesFileNames) => {
    // Get data from services JSON file - array with objects
    const blockedServices = await getBlockedServicesData(filePath);
    // Check if data is array
    if (!Array.isArray(blockedServices)) {
        return;
    }
    // TODO: get rid of "id" inside the "yml" file and take "id" directly from the "yml" filename
    // to avoid checking when adding new files and exclude the possibility of typos.
    // Array with normalized id of services from JSON file.
    const unifiedBlockedServicesNames = getBlockedServicesNames(blockedServices);
    // Get normalized yml file names
    const unifiedServiceFileNames = servicesFileNames.map((fileName) => normalizeFileName(fileName));
    // Array with the names of services, the id of which is present in services JSON file
    // and absent in the name of files from the services folder.
    const differences = unifiedBlockedServicesNames.filter((name) => !unifiedServiceFileNames.includes(name));
    // If there are missing services, find and rewrite the corresponding objects from blocked services.
    if (differences.length > 0) {
        const removedServiceObjects = blockedServices.filter(({ id }) => differences.includes(id));
        await writeRemovedServices(removedServiceObjects);
        console.log(`These services have been removed: ${differences.join(', ')}, and were rewritten`);
    }
};

module.exports = {
    restoreRemovedInputServices,
    normalizeFileName,
};
