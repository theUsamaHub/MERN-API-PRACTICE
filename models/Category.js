const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

categorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Category', categorySchema);
