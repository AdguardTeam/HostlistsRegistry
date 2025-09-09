const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('../helpers/logger');
const { serviceSchema } = require('./zod-schemas');

const YML_FILE_EXTENSION = '.yml';

/**
 * @typedef {require('./type-defs').Service} Service
 */

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
    serviceSchema.parse(removedObject);

    await fs.writeFile(
        path.join(`${sourceDirPath}/${removedObject.id}${YML_FILE_EXTENSION}`),
        yaml.dump(removedObject, { lineWidth: -1 }),
    );
    if (sourceDirPath.length > 1) {
        await restoreRemovedSourceFiles(restObjects);
    }
    const removedServices = differences.map((difference) => difference.id);
    logger.warn(`These services have been removed: ${removedServices.join(', ')}, and were restored`);
};

module.exports = {
    restoreRemovedSourceFiles,
};
