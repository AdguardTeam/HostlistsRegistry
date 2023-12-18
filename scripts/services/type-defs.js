/**
 * An object representing the service data.
 *
 * @typedef {object} Service
 * @property {string} id The id of the service.
 * @property {string} name The name of the service.
 * @property {string[]} rules List of domain rules in adblocking syntax.
 * @property {string} icon_svg The icon of the service in SVG format.
 */

/**
 * @typedef {{groups: groupedFileObjects}} categoryLocalesTranslate
 * @property {object} groupedFileObjects - An object containing grouped translations
 * for a specific group within a category and locale.
 */

/**
 * @typedef {{
 *   [id: string]: {
 *     [locale: string]: {
 *       sign: string;
 *     };
 *   };
 * }} groupedFileObjects
 * Example:
 * {
 *    'cdn': {
 *        'en': { 'name': 'Content Delivery Network' },
 *    },
 *    'dating': {
 *        'en': { 'name': 'Dating Services' },
 *    },
 *    // ...
 * }
 */
