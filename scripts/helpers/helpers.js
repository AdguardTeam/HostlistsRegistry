const { logger } = require('./logger');
/**
 * @typedef {object} ObjectWithID
 * @property {string} id - The identifier of the object.
 */

/**
 * Get the differences between two array of objects based on their 'id' property.
 *
 * @param {ObjectWithID[]} targetCollection - An array of target objects.
 * @param {ObjectWithID[]} sourceCollection - An array of source objects.
 * @returns {ObjectWithID[] | null} - An array containing objects representing the differences,
 * or null if no differences exist.
 */
const getDifferences = (targetCollection, sourceCollection) => {
    const differences = targetCollection.filter(
        (distObject) => !sourceCollection.find((sourceObject) => sourceObject.id === distObject.id),
    );
    return differences.length > 0 ? differences : null;
};

/**
 * Sorts a collection (array of objects) based on a specified property and sorting criteria.
 *
 * @typedef {object} AssociativeArrayItem
 * @property {string|number} key - The identifier property.
 */

/**
 * @typedef {Array<AssociativeArrayItem>} ObjectCollection
 */

/**
 * @param {ObjectCollection} objectCollection - The collection of items to be sorted.
 * @param {string} propName - The property name to use for sorting (key or value).
 * @param {(string|number)} [sortKey] - The key to sort the items by.
 *
 * @throws {Error} Will throw an error if the values for sorting are not strings or numbers.
 *
 * @returns {ObjectCollection} - The sorted collection.
 */
const sortByProperty = (objectCollection, propName, sortKey) => objectCollection.sort((a, b) => {
    try {
        const valueA = propName === 'value' ? a[sortKey] : Object.keys(a).join('');
        const valueB = propName === 'value' ? b[sortKey] : Object.keys(b).join('');

        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return valueA - valueB;
        } if (typeof valueA === 'string' && typeof valueB === 'string') {
            return valueA.localeCompare(valueB);
        }
        throw new Error('Invalid type. Must be either string or number.');
    } catch (error) {
        logger.error(error);
        throw error;
    }
});

module.exports = {
    getDifferences,
    sortByProperty,
};
