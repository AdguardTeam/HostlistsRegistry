const path = require('path');
const fs = require('fs/promises');
const builder = require('./hostlists-builder');

require('./scripts/check/check-node-version');

const { getJsonBlockedServicesData, getYmlSourcesBlockedServices } = require('./scripts/services/get-services-content');
const { mergeServicesData, groupServicesData } = require('./scripts/services/merge-services-data');
const { getDifferences } = require('./scripts/helpers/helpers');
const { restoreRemovedSourceFiles } = require('./scripts/services/restore-removed-services');
const { validateSvgIcons } = require('./scripts/services/validate-svg-icons');
const { addServiceLocalizations } = require('./scripts/services/add-localizations');
const { groupedServicesSchema, VALID_GROUP_NAMES_SET } = require('./scripts/services/zod-schemas');

const { logger } = require('./scripts/helpers/logger');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const groupsDir = path.join(__dirname, './groups');
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
        const [distBlockedServices, distBlockedGroups] = await getJsonBlockedServicesData(distFilePath);
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
            // Get groups name for warning
            const absentGroups = groupsDifferences.map((group) => group.id);
            logger.error(`These groups have no services: ${absentGroups.join(', ')}`);
        }

        // Find services with invalid groups
        const invalidService = groupedServicesData.blocked_services.find(
            (service) => !VALID_GROUP_NAMES_SET.has(service.group),
        );

        if (invalidService) {
            logger.error(`Invalid group "${invalidService.group}" for service "${invalidService.id}".`);
            // Exit the process with error code
            process.exit(1);
        }

        // Proceed with validation
        try {
            groupedServicesSchema.parse(groupedServicesData);
        } catch (error) {
            logger.error(`Validation error: ${error.message}`);
            process.exit(1);
        }
        // Write the grouped service data to the destination JSON file
        await fs.writeFile(distFilePath, `${JSON.stringify(groupedServicesData, null, 2)}\n`);
        logger.success(`Successfully finished building ${distFilePath}`);
    } catch (error) {
        logger.error(`Error occurred while building ${distFilePath} due to ${error.message}`);
    }
};

// Compile hostlists.
(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir, groupsDir);
        // build services.json file
        await buildServices(inputServicesDir, outputServicesFile);
        // add localizations for services groups
        await addServiceLocalizations(outputServicesFile, localesDir, servicesI18nFile);
        process.exit(0);
    } catch (error) {
        logger.error('Failed to compile hostlists', error);
        process.exit(1);
    }
})();
