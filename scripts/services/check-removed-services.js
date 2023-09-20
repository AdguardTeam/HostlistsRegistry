const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const servicesDir = path.resolve(__dirname, '../../services/');

/**
 * Converts a service name to lowercase and replaces special characters.
 *
 * @param {string} serviceName - The service name to be normalized.
 * @returns {string} The normalized service name.
 */
const normalizeFileName = (serviceName) => {
    const specificCharacters = new RegExp(/[^a-z0-9.]/, 'g');
    const lowerCased = serviceName.toLowerCase();
    const replaceSpecialCharacters = lowerCased.replace(specificCharacters, '');
    return replaceSpecialCharacters;
};

/**
 * Checks for removed services and rewrites YAML files if necessary.
 *
 * @param {string} distFolder - The path to the folder /services.
 * @param {string} servicesJSON - The path to the JSON file containing old services data /assets/services.json.
 * @throws {Error} If services have been removed, an error is thrown with the list of removed services.
 */
const checkRemovedServices = async (distFolder, servicesJSON) => {
/**
 * Reads and parses the old services data from a JSON file.
 *
 * @param {string} servicesFile - The path to the JSON file.
 * @returns {Promise<Array<Object>>} An array of old services data objects.
 */
    const getServicesData = async (servicesFile) => {
        try {
            const oldDataJSON = await fs.readFile(servicesFile);
            const oldDataObj = JSON.parse(oldDataJSON);
            return oldDataObj.blocked_services;
        } catch (error) {
            console.error('Error while reading JSON file:', error);
            return null;
        }
    };

    // old services array with objects
    const oldServicesData = await getServicesData(servicesJSON);

    if (!oldServicesData || !Array.isArray(oldServicesData)) {
        return;
    }

    /**
     * Retrieves the names of old services after normalization.
     *
     * @returns {Promise<Array<string>>} An array of normalized old service names.
     */
    const getOldServicesNames = async (oldData) => {
        // get array with id's from old data
        const oldServicesNameArray = oldData.map((service) => service.id);
        // format file names
        const formattedServiceNames = oldServicesNameArray.map((serviceName) => normalizeFileName(serviceName));
        // sort array by name
        formattedServiceNames.sort();
        return formattedServiceNames;
    };

    /**
     * Retrieves the names of new services from the specified folder after normalization.
     *
     * @param {string} folder - The path to the folder containing new service files.
     * @returns {Promise<Array<string>>} An array of normalized new service names.
     */
    const getNewServicesNames = async (distPath) => {
        // get all dir names from services folder
        const NewServicesFileNames = await fs.readdir(distPath);
        const NewServicesNameArray = NewServicesFileNames.map((file) => {
            // get only names without extension
            const onlyName = file.replace('.yml', '');
            return onlyName;
        });
        // format file names
        const formattedServiceNames = NewServicesNameArray.map((serviceName) => normalizeFileName(serviceName));
        // sort array by name
        formattedServiceNames.sort();
        return formattedServiceNames;
    };

    const newServicesNames = await getNewServicesNames(distFolder);
    const oldServicesNames = await getOldServicesNames(oldServicesData);

    const differences = oldServicesNames.filter((item) => !newServicesNames.includes(item));

    /**
     * Rewrites YAML files for removed services.
     *
     * @param {Array<string>} removedServices - An array of removed service names.
     */
    const rewriteYMLFile = async (removedServices) => {
        try {
            // Get objects from the old data, that have been deleted.
            const onlyRemovedObjects = removedServices
                .map((removedService) => {
                    const serviceItem = oldServicesData
                        .find((service) => normalizeFileName(service.id) === removedService);
                    return serviceItem;
                });
            /**
             * Write removed services into YML files.
             * @param {Array<object>} removedObjects - Array of objects that should be written in separate YML files.
             */
            const writeRemovedServices = async (removedObjects) => {
                if (removedObjects.length === 0) {
                    return;
                }
                const [removedObject, ...restObjects] = removedObjects;
                await fs.writeFile(
                    path.join(`${servicesDir}/${removedObject.id}.yml`),
                    yaml.dump(removedObject, { lineWidth: -1 }),
                );
                if (removedObjects.length > 1) {
                    await writeRemovedServices(restObjects);
                }
            };
            await writeRemovedServices(onlyRemovedObjects);
        } catch (error) {
            console.error('Error while rewriting file:', error);
        }
    };

    if (differences.length === 0) {
        console.log('No services have been removed');
    } else {
        await rewriteYMLFile(differences);
        throw new Error(`These services have been removed: ${differences.join(', ')}, and were rewritten`);
    }
};

module.exports = { checkRemovedServices };
