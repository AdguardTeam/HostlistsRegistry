/**
 * An object representing the service data.
 *
 * @typedef {object} Service
 * @property {string} id The id of the service.
 * @property {string} name The name of the service.
 * @property {string[]} rules List of domain rules in adblocking syntax.
 * @property {string} icon_svg The icon of the service in SVG format.
 * @property {string} group The group of the service.
 */

/**
 * @typedef {{ key: string}} Translation
 */

/**
 * @typedef {Translation[]} TranslationsCollection
 */

/**
 * @typedef {{ name: string }} TranslationName
 */

/**
 * @typedef {{ [key: string]: TranslationName }} TranslationLocale
 */

/**
 * @typedef {{ [key: string]: TranslationLocale }} TranslationId
 */

/**
 * @typedef {{ [key: string]: TranslationId }} ServicesI18
 */

/**
 * @typedef {object} Group
 * @property {string} id
 */

/**
 * @typedef {object} GroupedServices
 * @property {Service[]} blocked_services
 * @property {Group[]} groups
 */
