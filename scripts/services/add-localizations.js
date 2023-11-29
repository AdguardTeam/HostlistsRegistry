const fs = require('fs');
const path = require('path');

const localesDirPath = path.join(__dirname, '../../locales');

const servicesFile = 'services.json';
const i18_file = path.join(__dirname, '../../assets/services_i18n.json');

const getLocales = async (services, i18) => {
    // Получаем полный путь до директории
    const getDirFilePaths = (folderPath) => fs.readdirSync(folderPath)
        .filter((file) => fs.statSync(path.join(folderPath, file)).isDirectory())
        .map((file) => path.join(folderPath, file));

    const dirFilePaths = getDirFilePaths(services);

    const localeObject = {};
    const ValueObject = {};

    const result = [];

    dirFilePaths.map((dirFilePath) => {
        if (fs.existsSync(path.join(dirFilePath, servicesFile))) {
            const folder = dirFilePath.split('/').pop();
            const folderContent = fs.readFileSync(path.join(dirFilePath, servicesFile));
            const contentChunk = JSON.parse(folderContent);
            contentChunk.map((groupChunk) => {
                const group = Object.entries(groupChunk);
                for (let i = 0; i < group.length; i += 1) {
                    const combinedGroup = group[i];
                    const [prefix, id, postfix] = combinedGroup[0].split('.');
                    ValueObject[postfix] = combinedGroup[1];
                    localeObject[folder] = ValueObject;
                    result[id] = localeObject;
                }
            });
        }
    });

    fs.writeFileSync(i18, JSON.stringify(result));
};

getLocales(localesDirPath, i18_file);