const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const isInvalidId = (id) => !mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findByName = (name) =>
  Category.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });

// @route  POST /api/categories
// @desc   Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: 'Category name is required' });
    }

    const existing = await findByName(name);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, description });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error && error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'Category already exists' });
    }
    next(error);
  }
};

// @route  GET /api/categories
// @desc   Fetch all categories (with product counts) — used to populate dropdowns
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products',
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: { $size: '$products' },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res
      .status(200)
      .json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/categories/:id
// @desc   Fetch a single category
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid category id' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      data: { ...category.toObject(), productCount },
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/categories/:id
// @desc   Update a category (name / description)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid category id' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: 'Category not found' });
    }

    const { name, description } = req.body;
    let updated = false;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res
          .status(400)
          .json({ success: false, message: 'Category name cannot be empty' });
      }

      const existing = await findByName(trimmedName);
      if (existing && String(existing._id) !== id) {
        return res
          .status(409)
          .json({ success: false, message: 'Category already exists' });
      }

      category.name = trimmedName;
      updated = true;
    }

    if (description !== undefined) {
      category.description = String(description).trim();
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least a name or description to update',
      });
    }

    const saved = await category.save();
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    if (error && error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'Category already exists' });
    }
    next(error);
  }
};

// @route  DELETE /api/categories/:id
// @desc   Delete a category (blocked while products still use it)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid category id' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category: ${productCount} product(s) still use it`,
        count: productCount,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
