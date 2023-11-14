const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs/promises');
const { restoreRemovedInputServices } = require('./scripts/services/check-removed-services');
const { overwriteResultFile } = require('./scripts/services/rewrite-services-json');
const { logger } = require('./scripts/helpers/logger');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const inputServicesDir = path.join(__dirname, './services');
const outputServicesFile = path.join(assetsDir, 'services.json');

/**
 * Validate services JSON file.
 *
 * @param {string} filePath - The file path for services JSON file.
 * @throws {Error} - If JSON  is not valid.
 */
const validateJson = async (filePath) => {
    try {
        JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
        logger.error(`Failed to parse ${filePath}`, error.message);
        process.exit(1);
    }
};

/**
 * Gets the names of YML file from the services folder.
 *
 * @param {string} inputDirPath - The path to the folder with service files.
 * @returns {Promise<Array<string>>} - An array of services file names.
 */
const getServicesFileNames = async (inputDirPath) => {
    // get all dir names from services folder
    const fileNames = await fs.readdir(inputDirPath);
    // get the file names without its extension
    const fileBaseNames = fileNames.map((file) => path.parse(file).name);
    // return sorted array
    return fileBaseNames.sort();
};

/**
 * Builds the result services file and saves it to `resultFilePath`.
 * During the build the following steps are performed:
 * 1. Check if the services JSON file is valid.
 * 2. Check if the services in the folder have been deleted by comparing with the data in JSON file.
 * 3. If the information has been deleted, write the missing files.
 * 4. Collect information from the services files, sort and overwrite blocked services files.
 *
 * @param {string} inputDirPath - The directory path where the services data is located.
 * @param {string} resultFilePath - The file path for the "services.json" file.
 * @returns {Promise<void>} A promise that resolves when the building process is complete.
 */
const buildServices = async (inputDirPath, resultFilePath) => {
    try {
        await validateJson(resultFilePath);
        const serviceFileNames = await getServicesFileNames(inputDirPath);
        await restoreRemovedInputServices(resultFilePath, serviceFileNames, inputServicesDir);
        await overwriteResultFile(inputDirPath, resultFilePath, serviceFileNames);
        logger.success(`Successfully finished building ${resultFilePath}`);
        process.exit(0);
    } catch (error) {
        logger.error(`Error occurred while building ${resultFilePath}`, error.message);
        process.exit(1);
    }
};

// Compile hostlists.
(async () => {
    try {
        // await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
        await buildServices(inputServicesDir, outputServicesFile);
    } catch (error) {
        logger.error('Failed to compile hostlists');
        process.exit(1);
    }
})();
