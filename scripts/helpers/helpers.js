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
    // Build a fast lookup set of source IDs to avoid O(n*m) scans
    const sourceIds = new Set(sourceCollection.map(({ id }) => id));
    const differences = targetCollection.filter(({ id }) => !sourceIds.has(id));
    return differences.length > 0 ? differences : null;
};

/**
 * Sorts an array of objects by the value of a given key.
 * If the values are numbers, they will be sorted numerically.
 * If the values are strings, they will be sorted alphabetically.
 * If the values are neither numbers nor strings, they will not be sorted.
 *
 * @param {object[]} arr - The array of objects to sort.
 * @param {string} key - The key to sort by.
 * @returns {object[]} - The sorted array of objects.
 */
const sortByKey = (arr, key) => {
    if (arr.length < 2) {
        return arr;
    }
    // Sort the array using the provided key
    return arr.sort(({ [key]: a }, { [key]: b }) => {
        // Check if both values are numbers
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }
        // Check if both values are strings
        if (typeof a === 'string' && typeof b === 'string') {
            return a.localeCompare(b);
        }
        // If the values are not numbers or strings, maintain the order
        return 0;
    });
};

/**
 * Gets the name of the first key in the provided object.
 *
 * @param {object} obj - The input object.
 * @returns {string} - The name of the first key in the object, or an empty string if the object is not valid.
 */
const getFirstKeyName = (obj) => {
    // check if obj is an object
    if (typeof obj !== 'object' || obj === null) {
        return '';
    }
    // Return the name of the first key in the object, or an empty string if no keys are present
    return Object.keys(obj)[0] || '';
};

/**
 * Sorts an array of objects based on the name of their first key in lexicographical order.
 * This is necessary to sort an array of objects by item id, which is specified in the key
 *
 * @param {Array<object>} arr - The array of objects to be sorted.
 * @returns {Array<object>} - The sorted array of objects.
 *
 * @example
 * const arr =
 * [{{cdn.name: 'Cdn'},{cdn.description: 'Content Delivery Network'}},
 * {{gambling.name: 'Gambling'},{gambling.description: 'Gambling'}},
 * {{dating.name: 'Dating Services'},{dating.description: 'Dating Services'}}]
 *
 * sortByFirstKeyName(array) =>
 * [{{cdn.name: 'Cdn'},{cdn.description: 'Content Delivery Network'}},
 * {{dating.name: 'Dating Services'},{dating.description: 'Dating Services'}},
 * {{gambling.name: 'Gambling'},{gambling.description: 'Gambling'}}]
 */
const sortByFirstKeyName = (arr) => {
    // Trivial case
    if (arr.length < 2) {
        return arr;
    }
    // Sort objects by their first key name in lexicographical order
    return arr.sort((a, b) => getFirstKeyName(a).localeCompare(getFirstKeyName(b)));
};

module.exports = {
    sortByKey,
    sortByFirstKeyName,
    getDifferences,
};
