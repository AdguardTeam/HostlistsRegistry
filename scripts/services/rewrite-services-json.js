const { promises: fs } = require('fs');

const { validateSvgIcons } = require('./validate-svg-icons');

const { getServiceFilesContent } = require('./helpers');

/**
 * Overwrites the content of a result file with combined service data.
 *
 * @param {string} inputDirPath - The path to the directory containing service files.
 * @param {string} resultFilePath - The path to the result file to be overwritten.
 * @param {string[]} serviceFileNames - An array of service file names to read content from.
 * @returns {Promise<void>} - A Promise that resolves when the operation is complete.
 */
const overwriteResultFile = async (inputDirPath, resultFilePath, serviceFileNames) => {
    // Array with YML files content.
    const combinedServiceContent = await getServiceFilesContent(inputDirPath, serviceFileNames);

    const servicesGroupsMap = {};
    const combinedGroups = [];

    combinedServiceContent.forEach((service) => {
        if (!servicesGroupsMap[service.group]) {
            servicesGroupsMap[service.group] = true;
            combinedGroups.push({ id: service.group });
        }
    });

    combinedGroups.sort((a, b) => a.id.localeCompare(b.id));
    // Validate SVG icons. If the svg icon is not valid, an error is thrown.
    validateSvgIcons(combinedServiceContent);
    // Object to store the blocked services JSON file content.
    const servicesData = {};

    // Write the sorted services array into the blocked_services key.
    servicesData.blocked_services = combinedServiceContent.sort();
    servicesData.groups = combinedGroups;
    // Rewrite services JSON file.
    await fs.writeFile(resultFilePath, JSON.stringify(servicesData, null, 2));
};

module.exports = {
    overwriteResultFile,
};
