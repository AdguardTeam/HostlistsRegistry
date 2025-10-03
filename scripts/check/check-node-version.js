#!/usr/bin/env node

const semver = require('semver');
const { engines } = require('../../package.json');

const requiredNodeVersion = engines?.node;
const currentNodeVersion = process.version;

if (!requiredNodeVersion) {
    console.warn("No Node.js version specified in package.json under 'engines.node'. Skipping version check.");
    process.exit(0);
}

if (!semver.satisfies(currentNodeVersion, requiredNodeVersion)) {
    console.error(
        // eslint-disable-next-line max-len
        `❌ Installed Node.js version ${currentNodeVersion} does NOT satisfy the required version ${requiredNodeVersion} defined in package.json.`,
    );
    process.exit(1);
}
