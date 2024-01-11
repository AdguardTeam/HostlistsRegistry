const { logger } = require('../helpers/logger');

/**
 * @typedef {require('./type-defs').Service} Service
 */

/**
 * Sorts an array of objects based on their identifiers (ID).
 *
 * @param {Array} arrayOfObjects - The array of objects to be sorted.
 * @returns {Array} - The sorted array of objects.
 */
const sortByID = (arrayOfObjects) => arrayOfObjects.sort((objectA, objectB) => {
    /**
     * Compares two objects based on their identifiers (ID).
     *
     * @param {object} a - The first object for comparison.
     * @param {object} b - The second object for comparison.
     * @returns {number} - The result of the comparison (-1, 0, or 1).
     */
    if (objectA.id < objectB.id) {
        return -1;
    }
    if (objectA.id > objectB.id) {
        return 1;
    }
    return 0;
});

/**
 * Merges service data from source and destination content based on their 'id' property.
 *
 * @param {Service[]} distServices - An array of objects representing service data from the destination.
 * @param {Service[]} sourceServices - An array of objects representing service data from the source.
 * @returns {Service[]}  - An array containing unique objects merged from both input arrays,
 * with duplication handled by the 'id' property.
 */
const mergeServicesData = (distServices, sourceServices) => {
    const mergedMap = [...distServices, ...sourceServices].reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    return Object.values(mergedMap);
};

/**
 * Combines service data into a structured format with grouped services and sorted groups.
 *
 * @param {Service[]} combinedServiceContent - An array of objects representing combined service data.
 * @returns {object} - Object containing structured service data.
 *
 * @throws {Error} - Throws an error if the input data is not in the expected format or group is empty
 */
const groupServicesData = (combinedServiceContent) => {
    try {
        // Object to store the service groups during iteration
        const servicesGroupsMap = {};
        // Array to store the final combined service groups
        const combinedGroups = [];
        // Array to store services with empty groups
        const invalidGroupNames = [];
        // Iterate through the combined service content to build service groups
        combinedServiceContent.forEach((service) => {
            if (!service.group) {
                invalidGroupNames.push(service.id);
            }
            if (!servicesGroupsMap[service.group]) {
                servicesGroupsMap[service.group] = true;
                combinedGroups.push({ id: service.group });
            }
            return combinedGroups;
        });
        if (invalidGroupNames.length > 0) {
            throw new Error(`Services with id: ${invalidGroupNames.join(', ')} has an empty or missing 'group' key.`);
        }
        // Sort the combined groups array lexicographically by 'id'
        const sortedGroups = sortByID(combinedGroups);
        // Object to store the final service data structure
        const servicesData = {};
        // Write the sorted combined service content array into the 'blocked_services' key
        servicesData.blocked_services = sortByID(combinedServiceContent);
        // Write the sorted combined groups array into the 'groups' key
        servicesData.groups = sortedGroups;
        // Return the structured service data
        return servicesData;
    } catch (error) {
        logger.error(`Error while grouping services data: ${error}`);
        throw new Error(error);
    }
};

module.exports = {
    mergeServicesData,
    groupServicesData,
};
