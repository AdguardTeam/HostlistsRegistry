// globals require, __dirname, process

const path = require('path');
const builder = require('adguard-hostlists-builder');
const fs = require('fs');
const { checkRemovedServices } = require('./scripts/services/check-removed-services');
const { rewriteServicesJSON } = require('./scripts/services/rewrite-services-json');

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');
const servicesDir = path.join(__dirname, './services');
const servicesJSON = path.join(__dirname, './assets/services.json');

// build services.json from services folder
const buildServices = async (dirPath, filePath) => {
    try {
        await checkRemovedServices(dirPath, filePath);
        await rewriteServicesJSON(dirPath, filePath);
        console.log('Successfully finished building services.json');
        process.exit(0);
    } catch (error) {
        console.log('Building services.json finished with an error', error);
        process.exit(1);
    }
};

// Validate services.json and make sure it is a valid JSON.
try {
    JSON.parse(fs.readFileSync(servicesJSON, 'utf8'));
} catch (ex) {
    console.error('Failed to parse services.json', ex);
    process.exit(1);
}
// Compile hostlists.
(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
        await buildServices(servicesDir, servicesJSON);
    } catch (e) {
        console.error('Failed to compile hostlists', e);
        process.exit(1);
    }
})();
