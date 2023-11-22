const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';

const servicesDir = path.resolve(__dirname, '../../services/');
const { logger } = require('../helpers/logger');

/**
 * Write removed services objects into files.
 *
 * @param {Array<object>} removedObjects - Array of objects that should be written in separate files.
 */
const writeRemovedServices = async (removedObjects, distPath) => {
    if (removedObjects.length === 0) {
        return;
    }
    const [removedObject, ...restObjects] = removedObjects;
    await fs.writeFile(
        path.join(`${distPath}/${removedObject.id}${YML_FILE_EXTENSION}`),
        yaml.dump(removedObject, { lineWidth: -1 }),
    );
    if (removedObjects.length > 1) {
        await writeRemovedServices(restObjects);
    }
};

// TODO: Do a svg check before finding differences
// After recovering deleted files - merge them together

// TODO: Check for an empty string inside a yml file, write about it in the docs and add if necessary.

// TODO: Rename folders and files to be more consistent

// TODO: Get JSON data and YML data in one place

/**
 * Checks if any of the input service data objects is removed
 * and restores it from the `resultFilePath` file.
 *
 * IMPORTANT: Services which previously were built to the `resultFilePath` file **should not be removed**.
 *
 * During the process service `id`s are checked against normalized YML file names
 * and if there are any differences, the corresponding service YML files are restored.
 *
 * @param {string} resultFilePath - The path to the JSON file containing services data.
 * @param {Array<string>} servicesFileNames - Array of services file names from services folder.
 * @param {string} distFilePath - The path to the YML files containing services data.
 * @param blockedServices
 * @param serviceFilesContent
 * @param differences
 * @returns {Promise<void>} - A promise that resolves when the process is complete.
 * @throws {Error} - If the services data file could not be read or parsed, or if the data is not an array.
 */
const restoreRemovedInputServices = async (differences, distPath) => {
    // TODO: Rewrite writeRemovedServices to not call it recursively
    await writeRemovedServices(differences, servicesDir);
    const removedServices = differences.map((difference) => difference.id);
    logger.warning(`These services have been removed: ${removedServices.join(', ')}, and were restored`);
};

const getDifferences = async (blockedServices, serviceFilesContent) => {
    if (!Array.isArray(blockedServices)) {
        throw new Error('Blocked services data is not an array');
    }
    const differences = blockedServices.filter(
        (blockedService) => !serviceFilesContent.find((serviceFile) => serviceFile.id === blockedService.id),
    );
    return (differences.length > 0) ? differences : false;
};

module.exports = {
    restoreRemovedInputServices,
    getDifferences,
};
