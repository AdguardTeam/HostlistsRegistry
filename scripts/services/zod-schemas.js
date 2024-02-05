const { z } = require('zod');

/**
 * Zod schema for translating a specific service group.
 * The key should start with 'servicesgroup.' and end with '.name' and the value should be a string.
 * Should be only one property in the object.
 *
 * @example { 'servicesgroup.cdn.name': 'Content Delivery Network' }
 */
const translationSchema = z.record(
    z.string().regex(/^servicesgroup\.[a-z_]+\.name$/),
    z.string(),
).refine((obj) => Object.keys(obj).length === 1, {
    message: 'Object must have exactly 1 property',
});

/**
 * Zod schema for an array of translation objects.
 *
 * @example [{ 'servicesgroup.cdn.name': 'Content Delivery Network' }]
 */
const translationsCollectionSchema = z.array(translationSchema);

/**
 * Zod schema for translation of a specific name in a locale.
 *
 * @example {'name': 'Content Delivery Network'}
 */
const translationNameSchema = z.object({ name: z.string() }).strict();

/**
 * Zod schema for translating a specific service group in different locales.
 *
 * @example {'en': {'name': 'Content Delivery Network'}}
 */
const translationLocaleSchema = z.record(
    z.string().regex(/^[a-zA-Z_]+$/),
    translationNameSchema,
);

/**
 * Zod schema for translating a specific service group in different locales.
 *
 * @example {'cdn':{'en': {'name': 'Content Delivery Network'}}}
 */
const translationIdSchema = z.record(
    z.string().regex(/^[a-z_]+$/),
    translationLocaleSchema,
);

/**
 * Zod schema for a set of translation data for service groups.
 *
 * @example {'groups': {'cdn':{'en': {'name': 'Content Delivery Network'}}}}
 */
const servicesI18Schema = z.object({ groups: translationIdSchema });

/**
 * Zod schema for a service.
 *
 * @example { id: 'cdn', name: 'Content Delivery Network', rules: [], icon_svg: '', group: 'cdn' }
 */
const serviceSchema = z.object({
    id: z.string(),
    name: z.string(),
    rules: z.array(z.string()),
    icon_svg: z.string(),
    group: z.string(),
}).strict();

/**
 * Zod schema for services grouped by blocked_services and groups.
 *
 * @example { blocked_services: [], groups: [{ id: 'cdn' }] }
 */
const groupedServicesSchema = z.object({
    blocked_services: z.array(serviceSchema),
    groups: z.array(z.object({ id: z.string() }).strict()),
});

module.exports = {
    translationSchema,
    translationsCollectionSchema,
    servicesI18Schema,
    serviceSchema,
    groupedServicesSchema,
};
