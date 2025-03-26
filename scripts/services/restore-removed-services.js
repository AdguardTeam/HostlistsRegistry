const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('../helpers/logger');

const YML_FILE_EXTENSION = '.yml';

/**
 * @typedef {require('./type-defs').Service} Service
 */

/**
 * Get the differences between blocked services and source service files based on their 'id' property.
 *
 * @param {Service[]} distServices - An array of objects representing service data from the destination.
 * @param {Service[]} sourceServices - An array of objects representing service files from the source.
 * @returns {Service[] | null} - An array containing objects representing the differences,
 * or null if no differences exist.
 */
const getDifferences = (distServices, sourceServices) => {
    const differences = distServices.filter(
        (distObject) => !sourceServices.find((sourceObject) => sourceObject.id === distObject.id),
    );
    return differences.length > 0 ? differences : null;
};

// TODO: rewrite the function to avoid using recursion
/**
 * Write removed services objects into files.
 *
 * @param {Service[]} differences - Array of objects that should be written in separate files.
 * @param {string} sourceDirPath - The path to the directory containing YAML files.
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
