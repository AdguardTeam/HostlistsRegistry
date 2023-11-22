const { validateSvgIcons } = require('./validate-svg-icons');

const getCombinedServicesData = async (combinedServiceContent) => {
    const servicesGroupsMap = {};
    const combinedGroups = [];

    combinedServiceContent.forEach((service) => {
        if (!servicesGroupsMap[service.group]) {
            servicesGroupsMap[service.group] = true;
            combinedGroups.push({ id: service.group });
        }
    });

    combinedGroups.sort((a, b) => a.id.localeCompare(b.id));
    // Validate SVG icons. If the svg icon is not valid, an error is thrown.
    validateSvgIcons(combinedServiceContent);
    // Object to store the blocked services JSON file content.
    const servicesData = {};

    // Write the sorted services array into the blocked_services key.
    servicesData.blocked_services = combinedServiceContent.sort();
    servicesData.groups = combinedGroups;
    return servicesData;
};

module.exports = {
    getCombinedServicesData,
};
