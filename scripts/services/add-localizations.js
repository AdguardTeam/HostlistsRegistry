const { promises: fs } = require('fs');
const path = require('path');

const LOCALES_DIRECTORY_PATH = path.join(__dirname, '../../locales');

const SERVICES_FILE_NAME = 'services.json';
const I18_FILE_PATH = path.join(__dirname, '../../assets/services_i18n.json');

/**
 * Returns only directories names from folder
 *
 * @param {string} folderPath folder path
 * @returns {Array<string>} only directories names in folder
 */
const getDirFileNames = async (folderPath) => (await fs.readdir(folderPath, { withFileTypes: true }))
    .filter((folderFile) => folderFile.isDirectory())
    .map((folderFile) => folderFile.name);

/**
 *
 * @param {string} folderPath //
 * @param {string} targetFile //
 * @returns
 */
const findDirectoriesWithFile = async (folderPath, targetFile) => {
    const dirNames = await getDirFileNames(folderPath);
    const results = await Promise.all(
        dirNames.map(async (dirName) => {
            const dirPath = path.join(folderPath, dirName, targetFile);
            const isExist = async (filePath) => fs.access(filePath, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false);
            if (await isExist(dirPath)) {
                return dirName;
            }
            return null;
        }),
    );

    return results.filter((result) => result !== null);
};

const groupLocaleObject = (fileObjects, locale) => {
    const categoryObjects = {};
    fileObjects.forEach((fileObject) => {
        Object.entries(fileObject).forEach(([key, value]) => {
            const [category, id, sign] = key.split('.');
            const translate = { [sign]: value };
            const localesTranslate = { [locale]: translate };
            const componentLocalesTranslate = { [id]: localesTranslate };
            if (categoryObjects[category]) {
                // Category already exists, add to it
                Object.assign(categoryObjects[category], componentLocalesTranslate);
            } else {
                // Category doesn't exist, create a new one
                categoryObjects[category] = componentLocalesTranslate;
            }
        });
    });

    return categoryObjects;
};

const getLocaleObject = async (folder, directories, file) => {
    const promises = directories.map(async (directory) => {
        const filePath = path.join(folder, directory, file);
        const fileContent = JSON.parse(await fs.readFile(filePath));
        return groupLocaleObject(fileContent, directory);
    });
    return Promise.all(promises);
};

const getLocales = async (localesFolderPath, serviceFile) => {
    const directoriesWithFile = await findDirectoriesWithFile(localesFolderPath, serviceFile);
    const categoryLocalesTranslate = await getLocaleObject(localesFolderPath, directoriesWithFile, serviceFile);
    return Object.assign({}, ...categoryLocalesTranslate);
};

const writeI18File = async (localesFolderPath, serviceFile, i18FilePath) => {
    const localizations = await getLocales(localesFolderPath, serviceFile);
    await fs.writeFile(i18FilePath, JSON.stringify(localizations, null, 4));
};

(async () => {
    await writeI18File(LOCALES_DIRECTORY_PATH, SERVICES_FILE_NAME, I18_FILE_PATH);
})();
