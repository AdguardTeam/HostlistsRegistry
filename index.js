const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs');
const { checkRemovedServices } = require('./scripts/services/check-removed-services');
const { rewriteServicesJSON } = require('./scripts/services/rewrite-services-json');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const inputServicesDir = path.join(__dirname, './services');
const outputServicesFile = path.join(assetsDir, 'services.json');

/**
 * Validate services.json and make sure it is a valid JSON.
 *
 * @param {string} filePath The file path for the "services.json" file.
 * @throws {Error} If JSON file is not valid.
 */
const validateJson = (filePath) => {
    try {
        JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error('Failed to parse services.json', error);
        process.exit(1);
    }
};

/**
 * Builds the "services.json" file by performing the following steps:
 * 1. Check if the services.json file is valid.
 * 2. Check if the services in the "/services" folder have been deleted by comparing with the data in "services.json".
 * 3. If the information has been deleted, write the missing files.
 * 4. Collect information from the services files, sort and overwrite "services.json".
 *
 * @param {string} dirPath - The directory path where the services data is located.
 * @param {string} filePath - The file path for the "services.json" file.
 * @returns {Promise<void>} A promise that resolves when the building process is complete.
 */
const buildServices = async (dirPath, filePath) => {
    try {
        validateJson(filePath);
        await checkRemovedServices(dirPath, filePath);
        await rewriteServicesJSON(dirPath, filePath);
        console.log('Successfully finished building services.json');
        process.exit(0);
    } catch (error) {
        console.log('Building services.json finished with an error', error);
        process.exit(1);
    }
};

// Compile hostlists.
(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
        await buildServices(inputServicesDir, outputServicesFile);
    } catch (error) {
        console.error('Failed to compile hostlists', error);
        process.exit(1);
    }
})();
