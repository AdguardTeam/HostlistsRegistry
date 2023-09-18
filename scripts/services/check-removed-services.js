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
        let OldServicesDataArray = [];
        try {
            // get json data
            const OldDataJSON = await fs.readFile(servicesFile);
            // form json to object
            const OldDataObj = JSON.parse(OldDataJSON);
            // get only services array
            OldServicesDataArray = OldDataObj.blocked_services;
        } catch (error) {
            console.error('Error while reading JSON file:', error);
        }
        return OldServicesDataArray;
    };

    // old services array with objects
    const OldServicesData = await getServicesData(servicesJSON);

    if (!OldServicesData) {
        return;
    }

    /**
     * Retrieves the names of old services after normalization.
     *
     * @returns {Promise<Array<string>>} An array of normalized old service names.
     */
    const getOldServicesNames = async () => {
        // get array with id's from old data
        const OldServicesNameArray = OldServicesData.map((service) => service.id);
        // format file names
        const formattedServiceNames = OldServicesNameArray.map((serviceName) => normalizeFileName(serviceName));
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
    const getNewServicesNames = async (folder) => {
        // get all dir names from services folder
        const NewServicesFileNames = await fs.readdir(folder);
        const NewServicesNameArray = NewServicesFileNames.map((file) => {
            // make names string types
            const stringFileName = file.toString();
            // get only names without extension
            const onlyName = stringFileName.replace('.yml', '');
            return onlyName;
        });
        // format file names
        const formattedServiceNames = NewServicesNameArray.map((serviceName) => normalizeFileName(serviceName));
        // sort array by name
        formattedServiceNames.sort();
        return formattedServiceNames;
    };

    const NewServicesNames = await getNewServicesNames(distFolder);
    const OldServicesNames = await getOldServicesNames();

    const differences = OldServicesNames.filter((item) => !NewServicesNames.includes(item));

    /**
     * Rewrites YAML files for removed services.
     *
     * @param {Array<string>} removedServices - An array of removed service names.
     */
    const rewriteYMLFile = async (removedServices) => {
        try {
            // get only removed objects
            const onlyRemovedObjects = [];
            for (const removedService of removedServices) {
                const serviceItem = OldServicesData
                    .find((service) => normalizeFileName(service.id) === removedService);
                if (serviceItem) {
                    onlyRemovedObjects.push(serviceItem);
                }
            }
            // write files
            for (const removedObject of onlyRemovedObjects) {
                await fs.writeFile(
                    path.join(`${servicesDir}/${removedObject.id}.yml`),
                    yaml.dump(removedObject),
                );
            }
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
