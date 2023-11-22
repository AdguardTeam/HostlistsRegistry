/**
 * Get the differences between blocked services and source service files based on their 'id' property.
 *
 * @param {Array<Object>} distContent - An array of objects representing service data from the destination.
 * @param {Array<Object>} sourceContent - An array of objects representing service files from the source.
 * @returns {Array<Object>|false} - An array containing objects representing the differences,
 * or false if no differences exist.
 *
 * @throws {Error} - Throws an error if the destination services data is not an array.
 */
const getDifferences = (distContent, sourceContent) => {
    if (!Array.isArray(distContent)) {
        throw new Error('Blocked services data is not an array');
    }
    const differences = distContent.filter(
        (distObject) => !sourceContent.find((sourceObject) => sourceObject.id === distObject.id),
    );
    return (differences.length > 0) ? differences : false;
};

/**
 * Merges service data from source and destination content based on their 'id' property.
 *
 * @param {Array<object>} sourceContent - An array of objects representing service data from the source.
 * @param {Array<object>} distContent - An array of objects representing service data from the destination.
 * @returns {Array<object>}  - An array containing unique objects merged from both input arrays,
 * with duplication handled by the 'id' property.
 */
const mergeServicesData = (sourceContent, distContent) => {
    const mergedMap = [...sourceContent, ...distContent].reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    return Object.values(mergedMap);
};

/**
 * Combines service data into a structured format with grouped services and sorted groups.
 *
 * @param {Array<object>} combinedServiceContent - An array of objects representing combined service data.
 * @returns {Promise<object>} - A Promise resolving to an object containing structured service data.
 *
 * @throws {Error} - Throws an error if the input data is not in the expected format.
 */
const groupServicesData = (combinedServiceContent) => {
    try {
        // Object to store the service groups during iteration
        const servicesGroupsMap = {};
        // Array to store the final combined service groups
        const combinedGroups = [];
        // Iterate through the combined service content to build service groups
        combinedServiceContent.forEach((service) => {
            if (!servicesGroupsMap[service.group]) {
                servicesGroupsMap[service.group] = true;
                combinedGroups.push({ id: service.group });
            }
        });
        // Sort the combined groups array lexicographically by 'id'
        combinedGroups.sort((a, b) => a.id.localeCompare(b.id));
        // Object to store the final service data structure
        const servicesData = {};
        // Write the sorted combined service content array into the 'blocked_services' key
        servicesData.blocked_services = combinedServiceContent.sort();
        // Write the sorted combined groups array into the 'groups' key
        servicesData.groups = combinedGroups;
        // Return the structured service data as a Promise
        return servicesData;
    } catch (error) {
        throw new Error('Error while grouping services data');
    }
};

module.exports = {
    getDifferences,
    mergeServicesData,
    groupServicesData,
};
