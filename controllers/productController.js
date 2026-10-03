const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { deleteImageFile } = require('../utils/fileHelper');

const buildImageUrl = (req, fileName) =>
  fileName ? `${req.protocol}://${req.get('host')}/uploads/${fileName}` : '';

const isInvalidId = (id) => !mongoose.isValidObjectId(id);

const resolveImageUrl = (req, file) => {
  if (file) return buildImageUrl(req, file.filename);
  return '';
};

// Accepts '' / null (clears the category) or a category _id from GET /api/categories
const validateCategory = async (value) => {
  const trimmed =
    value === null || value === undefined ? '' : String(value).trim();

  if (!trimmed) return { ok: true, value: null };

  if (!mongoose.isValidObjectId(trimmed)) {
    return {
      ok: false,
      message:
        'Invalid category id. Use a category _id from GET /api/categories',
    };
  }

  const exists = await Category.exists({ _id: trimmed });
  if (!exists) return { ok: false, message: 'Category not found' };

  return { ok: true, value: trimmed };
};

// @route  POST /api/products
// @desc   Create a new product (multipart/form-data, field: image)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!name || price === undefined) {
      if (req.file) deleteImageFile(buildImageUrl(req, req.file.filename));
      return res.status(400).json({
        success: false,
        message: 'Name and price are required fields',
      });
    }

    const categoryResult = await validateCategory(category);
    if (!categoryResult.ok) {
      if (req.file) deleteImageFile(buildImageUrl(req, req.file.filename));
      return res
        .status(400)
        .json({ success: false, message: categoryResult.message });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category: categoryResult.value,
      stock,
      image: resolveImageUrl(req, req.file),
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/products?category=<categoryId>
// @desc   Fetch all products (optionally filtered by category)
exports.getProducts = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.category) {
      if (!mongoose.isValidObjectId(req.query.category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category id in query parameter',
        });
      }
      filter.category = req.query.category;
    }

    const products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/products/:id
// @desc   Fetch single product details
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findById(id).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/products/:id
// @desc   Update product details (optionally replace/remove the image)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      if (req.file) deleteImageFile(buildImageUrl(req, req.file.filename));
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findById(id);
    if (!product) {
      if (req.file) deleteImageFile(buildImageUrl(req, req.file.filename));
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, category, stock, removeImage } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;

    if (category !== undefined) {
      const categoryResult = await validateCategory(category);
      if (!categoryResult.ok) {
        if (req.file) deleteImageFile(buildImageUrl(req, req.file.filename));
        return res
          .status(400)
          .json({ success: false, message: categoryResult.message });
      }
      product.category = categoryResult.value;
    }

    if (req.file) {
      const newImageUrl = buildImageUrl(req, req.file.filename);
      deleteImageFile(product.image);
      product.image = newImageUrl;
    } else if (removeImage === 'true') {
      deleteImageFile(product.image);
      product.image = '';
    }

    const updated = await product.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/products/:id
// @desc   Delete product record and remove associated image file from disk
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    deleteImageFile(product.image);

    res.status(200).json({
      success: true,
      message: 'Product and associated image deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
