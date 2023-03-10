/* globals require, __dirname, process */

const path = require('path');
const fs = require('fs');
const builder = require("adguard-hostlists-builder");

// Validate services.json and make sure it is a valid JSON.
try {
    JSON.parse(fs.readFileSync('assets/services.json', 'utf8'));
} catch (ex) {
    console.error('Failed to parse services.json', ex);
    process.exit(1);
}

// Compile hostlists.

const filtersDir = path.join(__dirname, './filters');
const assetsDir = path.join(__dirname, './assets');
const tagsDir = path.join(__dirname, './tags');
const localesDir = path.join(__dirname, './locales');

(async () => {
    try {
        await builder.build(filtersDir, tagsDir, localesDir, assetsDir);
    } catch (e) {
        console.error('Failed to compile hostlists', e)
    }
})();
