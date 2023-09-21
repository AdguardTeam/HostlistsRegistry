const { DOMParser } = require('xmldom');

/**
 * Parses the SVG string into an SVG DOM object.
 *
 * @param {string} svgIcon - The SVG string to parse.
 * @returns {Document} The parsed SVG DOM object.
 * @throws {Error} If there is an SVG syntax error, an error is thrown.
 */
const parseSVG = (svgIcon, serviceId) => {
    const parser = new DOMParser({ locator: {}, errorHandler: {} });
    try {
        const SVGObject = parser.parseFromString(svgIcon);
        return SVGObject;
    } catch (error) {
        throw new Error(`Invalid SVG for the service with id: '${serviceId}`);
    }
};

/**
 * Parses an SVG string and checks its syntax.
 *
 * @param {string} svgIcon - The SVG string to parse.
 * @param {string} serviceId - The name of the service associated with the SVG.
 * @throws {Error} If there is an SVG syntax error, an error is thrown.
 */
const checkSVG = (svgIcon, serviceId) => {
    const svgNode = parseSVG(svgIcon, serviceId);

    if (!svgNode.childNodes[0].nodeName || svgNode.childNodes[0].nodeName !== 'svg') {
        throw new Error(`${serviceId} : Parsed SVG object is undefined`);
    }

    const svgDocumentElement = svgNode.documentElement;

    // Checks if the SVG is square by comparing the viewBox dimensions.
    // If the SVG is not square, an error is thrown.
    const svgViewBox = svgDocumentElement.getAttribute('viewBox').split(' ');
    if (svgViewBox[2] !== svgViewBox[3]) {
        throw new Error(`${serviceId} : The icon must have a square shape.`);
    }
    // Checks if the SVG tag contains `width` and `height` attributes.
    // If `width` or `height` attributes are present, an error is thrown.
    if (svgDocumentElement.hasAttribute('height') || svgDocumentElement.hasAttribute('width')) {
        throw new Error(`${serviceId} : Svg tag must not contain 'width' and 'height' attributes`);
    }

    // Checks if the SVG tag contains `fill="currentColor"` attribute.
    // If the `fill` attribute is missing or not set to 'currentColor', an error is thrown.
    if (!svgDocumentElement.hasAttribute('fill') || svgDocumentElement.getAttribute('fill') !== 'currentColor') {
        throw new Error(`${serviceId} : Svg tag must contain 'fill="currentColor"' attribute.`);
    }
};
module.exports = { checkSVG };
