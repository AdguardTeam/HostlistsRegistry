const { DOMParser } = require('xmldom');

// get SVG string and parse it to SVG tag
const checkSVG = (serviceName, SVGString) => {
    // parse SVG in DOM document and check syntax
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
    // check width and height tags
    if (svgElement.hasAttribute('height') || svgElement.hasAttribute('width')) {
        throw new Error(`${serviceName} : Svg tag must not contain \`width\` and \`height\` attributes`);
    }
    // check fill='currentColor'
    if ((!svgElement.hasAttribute('fill')) || (svgElement.getAttribute('fill') !== 'currentColor')) {
        throw new Error(`${serviceName} : Svg tag must contain \`fill="currentColor"\` attribute. `);
    }
    // check if svg is square
    const svgViewBox = svgElement.getAttribute('viewBox').split(' ');
    if (svgViewBox[2] !== svgViewBox[3]) {
        throw new Error(`${serviceName} : The icon must have a square shape.`);
    }
};
module.exports = { checkSVG };
