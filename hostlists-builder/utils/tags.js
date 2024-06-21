const tagsMetadata = require('../../tags/metadata');

module.exports = (() => {
    /**
     * Builds a map from tags metadata
     * 
     * @return {Map<String, number>}
     */
    const buildTagsMap = function () {
        const map = new Map();
        for (const tagMetadata of tagsMetadata) {
            if (map.has(tagMetadata.keyword)) {
                throw new Error(`Duplicate entry encountered for tag: ${tagMetadata.keyword}`);
            }

            map.set(tagMetadata.keyword, tagMetadata.tagId);
        }

        return map;
    };

    const tagsMap = buildTagsMap();

    /**
     * Maps tags keywords to their ids, or throws an error if keyword is not found
     *
     * @param {string[]} tags
     *
     * @return {number[]}
     */
    const mapTagKeywordsToTheirIds = function (tags) {
        return tags.map((keyword) => {
            if (!tagsMap.has(keyword)) {
                throw new Error(`Cannot find a tag with keyword "${keyword}" in tags metadata`);
            }

            return tagsMap.get(keyword);
        });
    };

    /**
     * In case of backward compatibility
     * Adds 'languages' metadata field parsed from 'lang:' tags
     *
     * @param {string[]} tagsKeywords
     */
    const parseLangTag = function (tagsKeywords) {
        const languages = [];

        let hasRecommended = false;
        for (const tagKeyword of tagsKeywords) {
            if (!hasRecommended && tagKeyword === 'recommended') {
                hasRecommended = true;
            }

            if (tagKeyword.startsWith('lang:')) {
                languages.push(tagKeyword.substring(5));
            }
        }

        return hasRecommended ? languages : [];
    };

    return {
        mapTagKeywordsToTheirIds,
        parseLangTag,
    };
})();
