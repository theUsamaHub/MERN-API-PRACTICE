require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const connectDB = require('./config/db');

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', require('./routes/productRoutes'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Product CRUD API is running',
    endpoints: {
      products: `http://localhost:${PORT}/api/products`,
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

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
