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
 * Sorts an array of objects based on their identifiers (ID).
 *
 * @param {ObjectWithID[]} arrayOfObjects - The array of objects to be sorted.
 * @returns {ObjectWithID[]} - The sorted array of objects.
 */
const sortByID = (arrayOfObjects) => arrayOfObjects.sort((objectA, objectB) => {
    if (objectA.id < objectB.id) {
        return -1;
    }
    if (objectA.id > objectB.id) {
        return 1;
    }
    return 0;
});

module.exports = {
    getDifferences,
    sortByID,
};
