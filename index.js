/* globals require, __dirname, process */

const path = require('path');
const { promises: fs } = require('fs');
const builder = require("adguard-hostlists-builder");
const SVGParser = require('svg-parser');

// build services.json from services folder
(async() => {
    try {
        // variable to store json's objects
        let servicesData = []
        // array with all service names
        const dirNames = await fs.readdir('./services');
        // collect data from service files
        const collectData = dirNames.map(async(dirName) => {
            // get file path for reading data
            const filePath = path.resolve(`./services/${dirName}`)
            // get data from service file
            const fileData = await fs.readFile(filePath)
            // parse JSON string
            const fileDataObject = JSON.parse(fileData);
            // collect data in array
            servicesData.push(fileDataObject);
        })

        await Promise.all(collectData);

        // stores services.json file content
        let services = {}
        // sort object with services
        const sortedServicesData = servicesData.sort((a, b) => a.id.localeCompare(b.id));
        // check if SVG is valid
        sortedServicesData.map((serviceObject) => {
            try {
                const svgTree = SVGParser.parse(serviceObject.icon_svg);
                svgTree.children[0].tagName === 'svg';
                return true
            }
            catch (error) {
                console.log(`In ${serviceObject.id} SVG not valid`)
                process.exit(1);
            }
        })
        // write sorted services array by blocked_services key
        services["blocked_services"] = sortedServicesData;
        // rewrite services.json
        await fs.writeFile('./assets/services.json', JSON.stringify(services, null, 2));
    } catch (e) {
        console.error('Failed to build services.json', e);
        process.exit(1);
    }
})();

// Validate services.json and make sure it is a valid JSON.
(async() => {
    try {
        const servicesContent = await fs.readFile('./assets/services.json', 'utf8');
        JSON.parse(servicesContent);
    } catch (e) {
        console.error('Failed to parse services.json', ex);
        process.exit(1);
    }
})();

// Compile hostlists.
const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');

(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
    } catch (e) {
        console.error('Failed to compile hostlists', e);
        process.exit(1);
    }
})();
