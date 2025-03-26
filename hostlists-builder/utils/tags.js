/**
 * Tags metadata methods container
 */
module.exports = class TagsMetadataUtils {
    /**
     * Builds a map from tags metadata
     *
     * @param {Array<{tagId: number, keyword: string}>} tagsMetadata Tags list from tags/metadata.json
     */
    constructor(tagsMetadata) {
        this.tagsMap = new Map();

        tagsMetadata.forEach((tagMetadata) => {
            if (this.tagsMap.has(tagMetadata.keyword)) {
                throw new Error(`Duplicate entry encountered for tag: ${tagMetadata.keyword}`);
            }

            this.tagsMap.set(tagMetadata.keyword, tagMetadata.tagId);
        });
    }

    /**
     * Maps tags keywords to their ids, or throws an error if keyword is not found
     *
     * @param {string[]} tagsKeywords Tag keywords list
     *
     * @returns {number[]} list of matching identifiers
     */
    mapTagKeywordsToTheirIds(tagsKeywords) {
        return tagsKeywords.map((keyword) => {
            if (!this.tagsMap.has(keyword)) {
                throw new Error(`Cannot find a tag with keyword "${keyword}" in tags metadata`);
            }

            return this.tagsMap.get(keyword);
        });
    }

    /**
     * In case of backward compatibility
     * Adds 'languages' metadata field parsed from 'lang:' tags
     *
     * @param {string[]} tagsKeywords Tags keywords list
     *
     * @returns {string[]}
     */
    parseLangTag(tagsKeywords) {
        const languages = [];

        let hasRecommended = false;
        tagsKeywords.forEach((tagKeyword) => {
            if (!hasRecommended && tagKeyword === 'recommended') {
                hasRecommended = true;
            }

            if (tagKeyword.startsWith('lang:')) {
                languages.push(tagKeyword.substring(5));
            }
        });

        return hasRecommended ? languages : [];
    }
};
