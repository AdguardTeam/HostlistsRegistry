import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API constants
const API_URL = 'https://twosky.int.agrd.dev/api/v1/';
const LOCALES_DOWNLOAD_URL = `${API_URL}download`;
const LOCALES_UPLOAD_URL = `${API_URL}upload`;

// Locale constants
const BASE_LOCALE = 'en';

// File constants
const LOCALES_RELATIVE_PATH = '../../locales';
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

// Temporary file constants
const TEMP_MESSAGES_FILE = 'messages.json';
const TEMP_CONVERTED_FILE = 'converted.json';
const TEMP_CONVERTED_DIR = 'temp';

// Translation keys file path
const TWOSKY_FILE_PATH = path.resolve(__dirname, '../../.twosky.json');

export {
    BASE_LOCALE,
    API_URL,
    LOCALES_DOWNLOAD_URL,
    LOCALES_UPLOAD_URL,
    LOCALES_DIR,
    TEMP_MESSAGES_FILE,
    TEMP_CONVERTED_FILE,
    TWOSKY_FILE_PATH,
    TEMP_CONVERTED_DIR
}