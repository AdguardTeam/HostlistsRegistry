const { promises: fs } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { checkSVG } = require('./checkSVG');

// build services.json from services folder
const rewriteServicesJSON = async (servicesDir, servicesJSON) => {
    // variable to store json's object
    const servicesData = [];
    // array with all services names
    const fileNames = await fs.readdir(servicesDir);
    // read service data from services folder
    const readServiceData = async (fileName) => {
        try {
            const fileData = await fs.readFile(path.resolve(__dirname, servicesDir, fileName), 'utf8');
            const fileDataObject = yaml.load(fileData);
            // Push the parsed YAML data into the servicesData array
            servicesData.push(fileDataObject);
        } catch (er) {
            throw Error(`Error while reading YML file: "${fileName}"`, er);
        }
    };
    // read data from files
    const getServicesData = fileNames.map((fileName) => readServiceData(fileName));
    await Promise.all(getServicesData);

    // check that all file has correct svg
    const checkValidSVG = (servicesArray) => {
        const checkedServicesSVG = servicesArray.filter((service) => {
            const servicesSVG = service.icon_svg;
            const serviceID = service.id;
            return checkSVG(serviceID, servicesSVG);
        });
        if (checkedServicesSVG.length > 0) {
            return true;
        }
        return false;
    };
    checkValidSVG(servicesData);
    // stores services.json file content
    const services = {};
    // sort object with services by id
    const sortedServicesData = servicesData.sort((a, b) => a.id.localeCompare(b.id));
    // write sorted services array by blocked_services key
    services.blocked_services = sortedServicesData;
    // rewrite services.json
    await fs.writeFile(servicesJSON, JSON.stringify(services, null, 2));
};

module.exports = {
    rewriteServicesJSON,
};
