const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs/promises');

const { getJsonBlockedData, getYmlSourcesBlockedServices } = require('./scripts/services/get-services-content');
const { mergeServicesData, groupServicesData } = require('./scripts/services/merge-services-data');
const { getDifferences, sortByProperty } = require('./scripts/helpers/helpers');
const { restoreRemovedSourceFiles } = require('./scripts/services/restore-removed-services');
const { validateSvgIcons } = require('./scripts/services/validate-svg-icons');
const { addServiceLocalizations } = require('./scripts/services/add-localizations');

const { logger } = require('./scripts/helpers/logger');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const inputServicesDir = path.join(__dirname, './services');
const outputServicesFile = path.join(assetsDir, 'services.json');
const servicesI18nFile = path.join(assetsDir, 'services_i18n.json');

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
        const [distBlockedServices, distBlockedGroups] = await getJsonBlockedData(distFilePath);
        // Read content from the source YML files
        const sourceBlockedServices = await getYmlSourcesBlockedServices(sourceDirPath);
        // Get the differences between the destination and source data
        const servicesDifferences = getDifferences(distBlockedServices, sourceBlockedServices);
        // If there are differences, restore removed source files
        if (servicesDifferences) {
            await restoreRemovedSourceFiles(servicesDifferences, sourceDirPath);
        }
        // Merge data from the destination and source files
        const mergedServicesData = mergeServicesData(distBlockedServices, sourceBlockedServices);
        // Validate SVG icons in merged data. Throws an error if any SVG icon is not valid.
        validateSvgIcons(mergedServicesData);
        // Groups data by keys
        const groupedServicesData = groupServicesData(mergedServicesData);
        // Get the differences between the destination groups data and source groups data
        const groupsDifferences = getDifferences(distBlockedGroups, groupedServicesData.groups);
        // If there are differences, throw warning and add them to the services.json file
        if (groupsDifferences) {
            // Add to final services.json file absent groups
            groupedServicesData.groups = sortByProperty(
                [...groupedServicesData.groups, ...groupsDifferences],
                'value',
                'id',
            );
            // Get groups name for warning
            const absentGroups = groupsDifferences.map((group) => group.id);
            logger.warning(`These groups have no services: ${absentGroups.join(', ')}`);
        }
        // Write the grouped service data to the destination JSON file
        await fs.writeFile(distFilePath, JSON.stringify(groupedServicesData, null, 2));
        logger.success(`Successfully finished building ${distFilePath}`);
    } catch (error) {
        logger.error(`Error occurred while building ${distFilePath}`);
    }
};

// Compile hostlists.
(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
        // build services.json file
        await buildServices(inputServicesDir, outputServicesFile);
        // add localizations for services groups
        await addServiceLocalizations(outputServicesFile, localesDir, servicesI18nFile);
        process.exit(0);
    } catch (error) {
        logger.error('Failed to compile hostlists');
        process.exit(1);
    }
})();
