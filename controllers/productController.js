const mongoose = require('mongoose');
const Product = require('../models/Product');
const { deleteImageFile } = require('../utils/fileHelper');

const buildImageUrl = (req, fileName) =>
  fileName ? `${req.protocol}://${req.get('host')}/uploads/${fileName}` : '';

const isInvalidId = (id) => !mongoose.isValidObjectId(id);

const resolveImageUrl = (req, file) => {
  if (file) return buildImageUrl(req, file.filename);
  return '';
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

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      image: resolveImageUrl(req, req.file),
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/products
// @desc   Fetch all products
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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

    const product = await Product.findById(id);
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
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;

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
