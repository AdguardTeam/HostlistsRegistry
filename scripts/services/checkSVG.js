const { DOMParser } = require('xmldom')

// get SVG string and parse it to SVG tag
const checkSVG = (serviceName, SVGString) => {
    // parse SVG in DOM document and check syntax
    const parseSVG = (SVGString) => {
        const parser = new DOMParser({locator: {},errorHandler:{}});
        try {
            const SVGObject = parser.parseFromString(SVGString);
            if(!SVGObject){
                throw new Error(serviceName + ' : SVG syntax error');
            }
            return SVGObject;
        } catch (error) {
            throw error
        }
    }
    try {
        const svgNode = parseSVG(SVGString, serviceName);
        if (!svgNode.childNodes[0].nodeName || svgNode.childNodes[0].nodeName !== 'svg') {
            throw new Error(serviceName + ' : Parsed SVG object is undefined');
        }
        const svgElement = svgNode.documentElement;
        // check width and height tags
        if(svgElement.hasAttribute('height') || svgElement.hasAttribute('width')){
            throw new Error(serviceName + ' : Svg tag must not contain `width` and `height` attributes')
        }
        // check fill='currentColor'
        if((!svgElement.hasAttribute('fill')) || (svgElement.getAttribute('fill') !== 'currentColor')){
            throw new Error(serviceName + ' : Svg tag must contain `fill="currentColor"` attribute. This is important for themes to work properly.')
        }
        // check if svg is square
        const svgViewBox = svgElement.getAttribute('viewBox').split(' ')
        if(svgViewBox[2] !== svgViewBox[3]){
            throw new Error(serviceName + ' : The icon must have a square shape, i.e. the third and fourth parameters of the `viewBox` attribute must be equal.')
        }
    } catch (error) {
        throw error
    }
}
module.exports = {checkSVG}