const { DOMParser } = require('xmldom');

/**
 * Parses an SVG string and checks its syntax.
 *
 * @param {string} serviceName - The name of the service associated with the SVG.
 * @param {string} SVGString - The SVG string to parse.
 * @throws {Error} If there is an SVG syntax error, an error is thrown.
 */
const checkSVG = (serviceName, SVGString) => {
    /**
     * Parses the SVG string into an SVG DOM object.
     *
     * @param {string} SVGTag - The SVG string to parse.
     * @returns {Document} The parsed SVG DOM object.
     * @throws {Error} If there is an SVG syntax error, an error is thrown.
     */
    const parseSVG = (SVGTag) => {
        const parser = new DOMParser({ locator: {}, errorHandler: {} });
        try {
            const SVGObject = parser.parseFromString(SVGTag);
            return SVGObject;
        } catch (error) {
            throw new Error(`${serviceName} : SVG syntax error`);
        }
    };

    const svgNode = parseSVG(SVGString, serviceName);

    if (!svgNode.childNodes[0].nodeName || svgNode.childNodes[0].nodeName !== 'svg') {
        throw new Error(`${serviceName} : Parsed SVG object is undefined`);
    }

    const svgElement = svgNode.documentElement;

    /**
     * Checks if the SVG tag contains `width` and `height` attributes.
     *
     * @throws {Error} If `width` or `height` attributes are present, an error is thrown.
     */
    const checkWidthHeightAttributes = () => {
        if (svgElement.hasAttribute('height') || svgElement.hasAttribute('width')) {
            throw new Error(`${serviceName} : Svg tag must not contain \`width\` and \`height\` attributes`);
        }
    };

    /**
     * Checks if the SVG tag contains `fill="currentColor"` attribute.
     *
     * @throws {Error} If the `fill` attribute is missing or not set to 'currentColor', an error is thrown.
     */
    const checkFillAttribute = () => {
        if (!svgElement.hasAttribute('fill') || svgElement.getAttribute('fill') !== 'currentColor') {
            throw new Error(`${serviceName} : Svg tag must contain \`fill="currentColor"\` attribute.`);
        }
    };

    /**
     * Checks if the SVG is square by comparing the viewBox dimensions.
     *
     * @throws {Error} If the SVG is not square, an error is thrown.
     */
    const checkSquareSVG = () => {
        const svgViewBox = svgElement.getAttribute('viewBox').split(' ');
        if (svgViewBox[2] !== svgViewBox[3]) {
            throw new Error(`${serviceName} : The icon must have a square shape.`);
        }
    };

    checkWidthHeightAttributes();
    checkFillAttribute();
    checkSquareSVG();
};
module.exports = { checkSVG };
