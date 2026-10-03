const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const getImageFileName = (imageUrl) => {
  if (!imageUrl) return null;
  return path.basename(imageUrl);
};

const deleteImageFile = (imageUrl) => {
  const fileName = getImageFileName(imageUrl);
  if (!fileName) return;

  const filePath = path.join(UPLOADS_DIR, fileName);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) return;

  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to delete image file: ${err.message}`);
    }
  });
};

module.exports = { deleteImageFile, getImageFileName };
