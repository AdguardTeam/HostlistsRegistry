const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const YML_FILE_EXTENSION = '.yml';
const { logger } = require('./logger');

/**
 * Read and parse JSON file.
 *
 * @param {string} filePath - The path to the file.
 * @returns {Promise<object[]|null>} - Array of blocked services objects.
 * Returns `null` if there's an error during the process.
 * @throws {Error} - If the file cannot be read or parsed.
 */
const readDistFileContent = async (filePath) => {
    try {
        const fileContent = await fs.readFile(filePath);
        const serviceObjects = JSON.parse(fileContent);
        return serviceObjects.blocked_services;
    } catch (error) {
        logger.error(`Error while reading file ${filePath}`);
        throw new Error(error);
    }
};

/**
 * Gets the name of files from the folder.
 *
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<Array<string>>} - An array of file names.
 */
const getDirFileNames = async (folderPath) => {
    // get all dir names from services folder
    const fileNames = await fs.readdir(folderPath);
    // get the file names without its extension
    const fileBaseNames = fileNames.map((file) => path.parse(file).name);
    // return sorted array
    return fileBaseNames.sort();
};

/**
 * Reads and parses YAML files from a specified directory with given file names.
 *
 * @param {string} folderPath - The path to the directory containing YAML files.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of objects of YAML content.
 * @throws {Error} If there is an error while reading or parsing any of the YAML files, an error is thrown.
 */
const readSourceFilesContent = async (folderPath) => {
    const sourceFileNames = await getDirFileNames(folderPath);
    const invalidYmlFiles = [];
    // Reads data from a yml file and writes it to an object
    const sourceFileContent = await Promise.all(
        sourceFileNames.map(async (fileName) => {
            try {
                // Set the path to the file
                const serviceFilePath = path.resolve(__dirname, folderPath, `${fileName}${YML_FILE_EXTENSION}`);
                // Read the file and parse the content
                const fileChunk = await fs.readFile(serviceFilePath, 'utf-8');
                const fileData = yaml.load(fileChunk);
                return fileData;
            } catch (error) {
                // Collect the names of the invalid files
                invalidYmlFiles.push(fileName);
                return null;
            }
        }),
    );
    // If there are invalid files, throw an error
    if (invalidYmlFiles.length > 0) {
        throw new Error(`Error while reading YML files: ${invalidYmlFiles.join(', ')}`);
    }
    // Return the array of objects with YML files content if there are no errors
    return sourceFileContent;
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
    readSourceFilesContent,
    readDistFileContent,
    restoreRemovedSourceFiles,
};
