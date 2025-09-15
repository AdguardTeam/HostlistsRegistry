/**
 * Makes filter key validator object
 */
const { logger } = require('../../scripts/helpers/logger');

module.exports = function makeFilterKeyValidator() {
    const set = new Set();

    /**
     * Validates filter key. Throws error if validation fails
     *
     * @param {string} filterKey - The filter key to validate
     * @param {number} filterId - The filter ID for reference in error messages
     */
    return {
        validate(filterKey, filterId) {
            if (!filterKey) {
                logger.error('Empty filter key encountered', `Filter ID: ${filterId}`);
                throw new Error("Empty filter key encountered", filterId);
            }

            if (set.has(filterKey)) {
                logger.error(`Filter key "${filterKey}" already encountered earlier`, `Filter ID: ${filterId}`);
                throw new Error(`Filter key "${filterKey}" already encountered earlier`, filterId);
            }

            set.add(filterKey);
            logger.success(`Validated filter key: ${filterKey} for filter ID: ${filterId}`);
        }
    }
};
