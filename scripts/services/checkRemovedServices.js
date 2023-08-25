const { promises: fs, readdir } = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const checkRemovedServices = async (distFolder, servicesJSON) => {

    // changes names of services to lower case without, and all - change to _
    const normalizeFileName = (serviceName) => {
        const specificCharacters =  new RegExp(/[^a-z0-9.]/, 'g');
        const lowerCased = serviceName.toLowerCase();
        const replaceSpecialCharacters = lowerCased.replace(specificCharacters, '');
        return replaceSpecialCharacters;
    };

    // get array with old services objects and check if json is valid
    const getServicesData = async (servicesJSON) => {
        try {
            // get json data
            const OldDataJSON = await fs.readFile(servicesJSON);
            // form json to object
            const OldDataObj = JSON.parse(OldDataJSON);
            // get only services array
            const OldServicesDataArray = OldDataObj.blocked_services;
            return OldServicesDataArray;
        } catch (error) {
            console.error('Error while reading JSON file:', error);
        }
    }
    // old services array with objects
    const OldServicesData = await getServicesData(servicesJSON);

    if(!OldServicesData){
        return
    }

    const getOldServicesNames = async () => {
        // get only id's from old data
        const OldServicesNameArray = []
        // get array from id's
        OldServicesData.map((service) => {
            OldServicesNameArray.push(service.id)
        })
        // format file names
        const formattedServiceNames = OldServicesNameArray.map(serviceName => normalizeFileName(serviceName))
        // sort array by name
        formattedServiceNames.sort();
        return formattedServiceNames;
    }

    const getNewServicesNames = async (distFolder) => {
        // get all dir names from services folder
        const NewServicesFileNames = await fs.readdir(distFolder)
        const NewServicesNameArray = NewServicesFileNames.map((file) => {
            // make names string types
            const stringFileName = file.toString();
            // get only names without extension
            const onlyName = stringFileName.replace('.yml', '')
            return onlyName;
        });
        // format file names
        const formattedServiceNames = NewServicesNameArray.map(serviceName => normalizeFileName(serviceName))
        // sort array by name
        formattedServiceNames.sort();
        return formattedServiceNames;
    }

    const NewServicesNames = await getNewServicesNames(distFolder);
    const OldServicesNames = await getOldServicesNames();

    const differences = OldServicesNames.filter((item) => !NewServicesNames.includes(item));

    const rewriteYMLFile = async (differences) => {
        try {
            // get only removed objects
            const onlyRemovedObjects = [];
            for (const removedService of differences) {
                const serviceItem = OldServicesData.find(service => normalizeFileName(service.id) === normalizeFileName(removedService));
                if (serviceItem) {
                    onlyRemovedObjects.push(serviceItem);
                }
            }
            // write files
            for (const removedObject of onlyRemovedObjects) {
                await fs.writeFile(
                    path.join(appRoot, `../dist/${removedObject.id}.yml`),
                    yaml.dump(removedObject)
                );
            }
        } catch (error) {
            console.error('Error while rewrite file:', error);
        }
    };

    if (differences.length === 0) {
        console.log('No services have been removed');
    } else {
        await rewriteYMLFile(differences)
        throw new Error('These services have been removed: ' + differences.join(', ') + ', and was rewritten');
    }
}

module.exports = {checkRemovedServices}