const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs');
const { restoreRemovedInputServices, normalizeFileName } = require('./scripts/services/check-removed-services');
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
 * Gets the names of YML file from the services folder.
 *
 * @param {string} inputDirPath - The path to the folder containing YML service files.
 * @returns {Promise<Array<string>>} An array of normalized yml file names.
 */
const getYmlFileNames = async (inputDirPath) => {
    // get all dir names from services folder
    const ymlFiles = await fs.readdir(inputDirPath);
    // get the file names without its extension
    const ymlFileNames = ymlFiles.map((ymlFile) => path.parse(ymlFile).name);
    // format file names
    const formattedServiceNames = ymlFileNames.map(normalizeFileName);
    // return sorted array
    return formattedServiceNames.sort();
};

/**
 * Builds the result services file and saves it to `resultFilePath`.
 * During the build the following steps are performed:
 * 1. Check if the services.json file is valid.
 * 2. Check if the services in the "/services" folder have been deleted by comparing with the data in "services.json".
 * 3. If the information has been deleted, write the missing files.
 * 4. Collect information from the services files, sort and overwrite "services.json".
 *
 * @param {string} inputDirPath - The directory path where the services data is located.
 * @param {string} resultFilePath - The file path for the "services.json" file.
 * @returns {Promise<void>} A promise that resolves when the building process is complete.
 */
const buildServices = async (inputDirPath, resultFilePath) => {
    try {
        validateJson(resultFilePath);
        const ymlFileNames = getYmlFileNames(inputDirPath);
        await restoreRemovedInputServices(resultFilePath, ymlFileNames);
        await rewriteServicesJSON(inputDirPath, resultFilePath, ymlFileNames);
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
