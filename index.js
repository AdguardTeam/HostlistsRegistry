const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs/promises');
const { getDifferences, restoreRemovedInputServices } = require('./scripts/services/check-removed-services');
const { getCombinedServicesData } = require('./scripts/services/rewrite-services-json');
const { logger } = require('./scripts/helpers/logger');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const inputServicesDir = path.join(__dirname, './services');
const outputServicesFile = path.join(assetsDir, 'services.json');

const { getServiceFilesContent, getBlockedServicesData } = require('./scripts/services/helpers');

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
        const blockedServices = await getBlockedServicesData(resultFilePath);
        let serviceFilesContent = await getServiceFilesContent(inputDirPath);
        const differences = await getDifferences(blockedServices, serviceFilesContent);
        if (differences) {
            await restoreRemovedInputServices(differences, inputServicesDir);
            serviceFilesContent = await getServiceFilesContent(inputDirPath);
        }
        const combinedServicesData = await getCombinedServicesData(serviceFilesContent);
        await fs.writeFile(resultFilePath, JSON.stringify(combinedServicesData, null, 2));
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
