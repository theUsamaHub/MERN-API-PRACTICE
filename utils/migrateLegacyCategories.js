const Category = require('../models/Category');
const Product = require('../models/Product');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findCategoryByName = (name) =>
  Category.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });

// One-time, idempotent upgrade for products created before categories
// became a Category reference: string values like "Electronics" are turned
// into real Category documents and products are linked to them.
const migrateLegacyCategories = async () => {
  try {
    const legacy = await Product.collection
      .find({ category: { $type: 'string' } })
      .toArray();

    if (legacy.length === 0) {
      console.log('Category migration: no legacy string categories found');
      return;
    }

    let linked = 0;
    let created = 0;
    let cleared = 0;

    for (const product of legacy) {
      const raw =
        typeof product.category === 'string' ? product.category.trim() : '';

      if (!raw) {
        await Product.collection.updateOne(
          { _id: product._id },
          { $set: { category: null } }
        );
        cleared += 1;
        continue;
      }

      let category = await findCategoryByName(raw);
      if (!category) {
        category = await Category.create({ name: raw, description: '' });
        created += 1;
      }

      await Product.collection.updateOne(
        { _id: product._id },
        { $set: { category: category._id } }
      );
      linked += 1;
    }

    console.log(
      `Category migration: ${linked} product(s) linked, ${created} category(ies) created, ${cleared} cleared`
    );
  } catch (error) {
    console.error(`Category migration failed: ${error.message}`);
  }
};

module.exports = migrateLegacyCategories;
