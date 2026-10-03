require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const connectDB = require('./config/db');
const migrateLegacyCategories = require('./utils/migrateLegacyCategories');

const app = express();

const PORT = process.env.PORT || 5000;

connectDB().then(migrateLegacyCategories);

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Product & Category CRUD API is running',
    endpoints: {
      products: `http://localhost:${PORT}/api/products`,
      categories: `http://localhost:${PORT}/api/categories`,
      uploads: `http://localhost:${PORT}/uploads`,
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ success: false, message: 'File size too large (max 5MB)' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error && error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error && error.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid JSON in request body' });
  }

  if (error) {
    const status = error.status || error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
