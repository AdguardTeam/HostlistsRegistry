/**
 * Makes filter key validator object
 */
module.exports = function makeFilterKeyValidator() {
    const set = new Set();

    /**
     * Validates filter key. Throws error if validation fails
     *
     * @param string
     */
    return {
        validate(filterKey) {
            if (!filterKey) {
                throw new Error("Empty filter key encountered");
            }

            if (set.has(filterKey)) {
                throw new Error(`Filter key "${filterKey}" already encountered earlier`);
            }

            set.add(filterKey);
        }
    }
};
