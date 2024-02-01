const { z } = require('zod');

// { 'servicesgroup.cdn.name': 'Content Delivery Network' }
const translationSchema = z.record(
    z.string().regex(/^servicesgroup\.[a-z_]+\.name$/),
    z.string(),
).refine((obj) => Object.keys(obj).length === 1, {
    message: 'Object must have exactly 1 property',
});

// [{ 'servicesgroup.cdn.name': 'Content Delivery Network' }]
const translationsCollectionSchema = z.array(translationSchema);

// {'name': 'Content Delivery Network'}
const translationNameSchema = z.object({ name: z.string() }).strict();

// {'en': {'name': 'Content Delivery Network'}}
const translationLocaleSchema = z.record(
    z.string().regex(/^[a-zA-Z_]+$/),
    translationNameSchema,
);

// {'cdn':{'en': {'name': 'Content Delivery Network'}}}
const translationIdSchema = z.record(
    z.string().regex(/^[a-z_]+$/),
    translationLocaleSchema,
);

// {'groups': {'cdn':{'en': {'name': 'Content Delivery Network'}}}}
const servicesI18Schema = z.object({ groups: translationIdSchema });

module.exports = {
    translationsCollectionSchema,
    servicesI18Schema,
};
