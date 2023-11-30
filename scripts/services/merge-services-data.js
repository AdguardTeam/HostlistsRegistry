/**
 * Merges service data from source and destination content based on their 'id' property.
 *
 * @param {Array<object>} distContent - An array of objects representing service data from the destination.
 * @param {Array<object>} sourceContent - An array of objects representing service data from the source.
 * @returns {Array<object>}  - An array containing unique objects merged from both input arrays,
 * with duplication handled by the 'id' property.
 */
const mergeServicesData = (distContent, sourceContent) => {
    const mergedMap = [...distContent, ...sourceContent].reduce((acc, obj) => {
        acc[obj.id] = obj;
        return acc;
    }, {});
    return Object.values(mergedMap);
};

/**
 * Combines service data into a structured format with grouped services and sorted groups.
 *
 * @param {Array<object>} combinedServiceContent - An array of objects representing combined service data.
 * @returns {object} - Object containing structured service data.
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
        // Return the structured service data
        return servicesData;
    } catch (error) {
        throw new Error('Error while grouping services data');
    }
};

module.exports = {
    mergeServicesData,
    groupServicesData,
};
