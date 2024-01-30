/**
 * Get the differences between two array of objects based on their 'id' property.
 *
 * @param {Array<object>} targetCollection - An array of target objects.
 * @param {Array<object>} sourceCollection - An array of source objects.
 * @returns {Array<object> | null} - An array containing objects representing the differences,
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
 * @param {Array} arrayOfObjects - The array of objects to be sorted.
 * @returns {Array} - The sorted array of objects.
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
