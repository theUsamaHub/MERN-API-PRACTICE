require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

const TEST_URI = process.env.MONGODB_URI.replace(
  /mongodb\+srv:\/\/([^/]+)\/[^?]+/,
  'mongodb+srv://$1/productDB_cast_test'
);

const stamp = Date.now();

(async () => {
  try {
    await mongoose.connect(TEST_URI);

    await Product.collection.deleteMany({});
    await Category.collection.deleteMany({});

    await Product.collection.insertMany([
      {
        name: `Legacy Phone ${stamp}`,
        price: 500,
        category: 'Electronics',
        stock: 3,
        description: 'legacy string category',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: `Legacy Blank ${stamp}`,
        price: 10,
        category: '   ',
        stock: 1,
        description: 'legacy blank category',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: `Legacy None ${stamp}`,
        price: 5,
        stock: 1,
        description: 'legacy missing category',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('seeded legacy docs in test db');
  } catch (e) {
    console.log('SEED FAILED:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
