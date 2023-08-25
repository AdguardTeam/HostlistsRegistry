const { DOMParser } = require('xmldom')

// get SVG string and parse it to SVG tag
const checkSVG = (serviceName, SVGString) => {
    // check escape quotes
    const isQuotesEscaped = (SVGString) => {
        return /\"/.test(SVGString)
    }
    if(!isQuotesEscaped(SVGString)){
        console.log(serviceName + ' : Double quotes inside the SVG tag must be escaped so as not to break JSON')
        return false;
    }
    // remove escape characters from svg string
    const getSVGTag = (SVGString) => {return SVGString.replace(/\\/, '')}
    const SVGTag = getSVGTag(SVGString);
    // parse SVG in DOM Document and check syntax
    const parseSVG = (SVGTag) => {
        const parser = new DOMParser({locator: {},errorHandler:{error: serviceName + ' :SVG syntax error'}});
        try {
            const SVGObject = parser.parseFromString(SVGTag);
            return SVGObject
        } catch (error) {
            console.log(parser.options.errorHandler.error);
            return null
        }
    }
    const svgNode = parseSVG(SVGTag);
    // returns if syntax error in svg
    if (!svgNode) {
        return false;
    }
    const svgElement = svgNode.documentElement
    // check width and height tags
    if(svgElement.hasAttribute('height') || svgElement.hasAttribute('width')){
        console.log(serviceName + ' : Svg tag must not contain `width` and `height` attributes')
        return false;
    }
    // check fill='currentColor'
    if((!svgElement.hasAttribute('fill')) || (svgElement.getAttribute('fill') !== 'currentColor')){
        console.log(serviceName + ' : Svg tag must contain `fill="currentColor"` attribute. This is important for themes to work properly.')
        return false;
    }
    // check if svg is square
    const svgViewBox = svgElement.getAttribute('viewBox').split(' ')
    if(svgViewBox[2] !== svgViewBox[3]){
        console.log(serviceName + ' : The icon must have a square shape, i.e. the third and fourth parameters of the `viewBox` attribute must be equal.')
        return false;
    }
    return true;
}
module.exports = {checkSVG}