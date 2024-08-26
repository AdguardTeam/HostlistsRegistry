const path = require('path');
const fs = require('fs/promises');
const builder = require('../hostlists-builder');

const {
    getYmlSourcesBlockedServices,
    getJsonBlockedServices,
} = require('./services/get-services-content');
const {
    mergeServicesData,
    groupServicesData,
} = require('./services/merge-services-data');
const {
    getDifferences,
    restoreRemovedSourceFiles,
} = require('./services/restore-removed-services');
const { validateSvgIcons } = require('./services/validate-svg-icons');

const { logger } = require('./helpers/logger');

const ROOT_PATH = path.join(__dirname, '..');
const filtersDir = path.join(ROOT_PATH, './filters');
const assetsDir = path.join(ROOT_PATH, './assets');
const tagsDir = path.join(ROOT_PATH, './tags');
const groupsDir = path.join(ROOT_PATH, './groups');
const localesDir = path.join(ROOT_PATH, './locales');
const inputServicesDir = path.join(ROOT_PATH, './services');
const outputServicesFile = path.join(assetsDir, 'services.json');

/**
 * Build services data by reading and processing content from a destination JSON file
 * and source YAML files. Differences are handled, and the final grouped data is written back
 * to the destination JSON file.
 *
 * @param {string} sourceDirPath - The directory path containing source YAML files.
 * @param {string} distFilePath - The file path to the destination JSON file.
 * @returns {Promise<void>} - A Promise resolving once the build process is complete.
 *
 * @throws {Error} - Throws an error if there's an issue during the build process.
 */
const buildServices = async (sourceDirPath, distFilePath) => {
    try {
        // Read content from the JSON file
        const distBlockedServices = await getJsonBlockedServices(distFilePath);
        // Read content from the source YML files
        const sourceBlockedServices = await getYmlSourcesBlockedServices(sourceDirPath);
        // Get the differences between the destination and source data
        const differences = getDifferences(distBlockedServices, sourceBlockedServices);
        // If there are differences, restore removed source files
        if (differences) {
            await restoreRemovedSourceFiles(differences, sourceDirPath);
        }
        // Merge data from the destination and source files
        const mergedServicesData = mergeServicesData(distBlockedServices, sourceBlockedServices);
        // Validate SVG icons in merged data. Throws an error if any SVG icon is not valid.
        validateSvgIcons(mergedServicesData);
        // Groups data by keys
        const groupedServicesData = groupServicesData(mergedServicesData);
        // Write the grouped service data to the destination JSON file
        await fs.writeFile(distFilePath, JSON.stringify(groupedServicesData, null, 2));
        // Add localizations for service groups
        logger.success(`Successfully finished building ${distFilePath}`);
        process.exit(0);
    } catch (error) {
        logger.error(`Error occurred while building ${distFilePath}`, error.message);
        process.exit(1);
    }
};

// Compile hostlists.
(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir, groupsDir);
        await buildServices(inputServicesDir, outputServicesFile);
    } catch (error) {
        console.error(error);
        logger.error('Failed to compile hostlists');
        process.exit(1);
    }
})();
