const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('../helpers/logger');

const YML_FILE_EXTENSION = '.yml';

/**
 * Get the differences between blocked services and source service files based on their 'id' property.
 *
 * @param {Array<object>} distContent - An array of objects representing service data from the destination.
 * @param {Array<object>} sourceContent - An array of objects representing service files from the source.
 * @returns {Array<object> | null} - An array containing objects representing the differences,
 * or null if no differences exist.
 */
const getDifferences = (distContent, sourceContent) => {
    const differences = distContent.filter(
        (distObject) => !sourceContent.find((sourceObject) => sourceObject.id === distObject.id),
    );
    return (differences.length > 0) ? differences : null;
};

/**
 * Write removed services objects into files.
 *
 * @param {Array<object>} differences - Array of objects that should be written in separate files.
 * @param {string} sourceDir - The path to the directory containing YAML files.
 */

const restoreRemovedSourceFiles = async (differences, sourceDirPath) => {
    if (differences.length === 0) {
        return;
    }
    const [removedObject, ...restObjects] = differences;
    await fs.writeFile(
        path.join(`${sourceDirPath}/${removedObject.id}${YML_FILE_EXTENSION}`),
        yaml.dump(removedObject, { lineWidth: -1 }),
    );
    if (sourceDirPath.length > 1) {
        await restoreRemovedSourceFiles(restObjects);
    }
    const removedServices = differences.map((difference) => difference.id);
    logger.warning(`These services have been removed: ${removedServices.join(', ')}, and were restored`);
};

module.exports = {
    getDifferences,
    restoreRemovedSourceFiles,
};
