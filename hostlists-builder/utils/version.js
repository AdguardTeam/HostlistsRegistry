const START_VERSION = '1.0.0.0';

module.exports = (() => {
    /**
     * Parses a part of the version
     */
    const parseVersionPart = function (part) {
        if (Number.isNaN(part)) {
            return 0;
        }
        return Math.max(part, 0);
    };

    /**
     * Parses version from string
     *
     * @param v version string
     * @returns {Array}
     */
    const parse = function (v) {
        const version = [];
        const parts = String(v || '').split('.');

        // eslint-disable-next-line no-restricted-syntax
        for (const part of parts) {
            version.push(parseVersionPart(part));
        }

        return version;
    };

    /**
     * Increments build part of version '0.0.0.0'
     *
     * @param v version string
     * @returns {string}
     */
    const increment = function (v) {
        const version = parse(v);

        if (version.length > 0) {
            version[version.length - 1] = version[version.length - 1] + 1;
        }

        for (let i = version.length; i > 0; i -= 1) {
            if (version[i] >= 100 && i !== 0) {
                version[i] = 0;
                version[i - 1] += 1;
            }
        }

        return version.join('.');
    };

    return {
        increment,
        START_VERSION,
    };
})();