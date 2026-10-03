const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router
  .route('/')
  .post(createCategory)
  .get(getCategories);

router
  .route('/:id')
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
