const express = require('express');
const upload = require('../middleware/upload');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router
  .route('/')
  .post(upload.single('image'), createProduct)
  .get(getProducts);

router
  .route('/:id')
  .get(getProductById)
  .put(upload.single('image'), updateProduct)
  .delete(deleteProduct);

module.exports = router;
