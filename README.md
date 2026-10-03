PORT=5000
MONGODB_URI=mongodb+srv://usama:8OmkOlez4i42gYTq@cluster0.epsxqwv.mongodb.net/productDB?appName=Cluster0



# Product CRUD API

RESTful Product CRUD API built with **Express.js**, **MongoDB (Atlas)** and **Multer** for image uploading.

## Tech Stack

- Node.js + Express.js
- MongoDB Atlas (Mongoose ODM)
- Multer (multipart image upload)
- CORS, dotenv

## Setup & Run

```bash
npm install
npm start        # or: npm run dev (uses nodemon)
```

Server runs at `http://localhost:5000`

Environment variables (`.env`):

```
PORT=5000
MONGODB_URI=mongodb+srv://usama:<password>@cluster0.epsxqwv.mongodb.net/productDB?appName=Cluster0
```

## Project Structure

```
├── server.js                  # Express app entry point
├── config/db.js               # MongoDB connection
├── models/Product.js          # Mongoose product schema
├── middleware/upload.js       # Multer config + image file filter
├── controllers/productController.js
├── routes/productRoutes.js    # /api/products routes
├── utils/fileHelper.js        # Safe image file deletion
└── uploads/                   # Stored images (served statically)
```

## File Upload Rules

- Field name: `image` (multipart/form-data)
- Allowed extensions: `.png`, `.jpg`, `.jpeg`
- Max file size: 5MB
- Images are served at: `http://localhost:5000/uploads/<filename>`

---

## API Endpoints

Base URL: `http://localhost:5000`

### 1. Create Product — `POST /api/products`

`Content-Type: multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| name | text | Yes |
| price | number | Yes |
| description | text | No |
| category | text | No |
| stock | number | No |
| image | file (.png/.jpg/.jpeg) | No |

**Postman setup:** Body → raw/form-data → add key `image` and set type to **File** → select image.

**Sample request:**

```
name          = Test Phone
price         = 999
description   = A test product
category      = Electronics
stock         = 10
image         = (choose a .png/.jpg file)
```

**Sample response (201):**

```json
{
  "success": true,
  "data": {
    "name": "Test Phone",
    "description": "A test product",
    "price": 999,
    "category": "Electronics",
    "stock": 10,
    "image": "http://localhost:5000/uploads/1791005302426-260594333.png",
    "_id": "6ac09276f22f2b3f1e17bbcc",
    "createdAt": "2026-10-03T05:28:22.458Z",
    "updatedAt": "2026-10-03T05:28:22.458Z",
    "__v": 0
  }
}
```

**Error (400) — invalid file type:**

```json
{ "success": false, "message": "Only .png, .jpg and .jpeg image files are allowed" }
```

---

### 2. Get All Products — `GET /api/products`

No body required.

**Sample response (200):**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6ac09276f22f2b3f1e17bbcc",
      "name": "Test Phone",
      "description": "A test product",
      "price": 999,
      "category": "Electronics",
      "stock": 10,
      "image": "http://localhost:5000/uploads/1791005302426-260594333.png",
      "createdAt": "2026-10-03T05:28:22.458Z",
      "updatedAt": "2026-10-03T05:28:22.458Z",
      "__v": 0
    }
  ]
}
```

---

### 3. Get Single Product — `GET /api/products/:id`

`:id` = product `_id` from previous responses.

**Sample response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "6ac09276f22f2b3f1e17bbcc",
    "name": "Test Phone",
    "price": 999,
    "image": "http://localhost:5000/uploads/1791005302426-260594333.png"
  }
}
```

**Errors:**

- `400` — `{"success":false,"message":"Invalid product id"}`
- `404` — `{"success":false,"message":"Product not found"}`

---

### 4. Update Product — `PUT /api/products/:id`

`Content-Type: multipart/form-data` (when sending an image)
or `application/json` (when updating fields only)

- Only the fields you send are updated.
- Send `image` file → old image is replaced and the old file is deleted from disk.
- Send `removeImage=true` → image is removed without uploading a new one.

**Postman — with new image:** Body → form-data → fields + `image` (File type)

**Postman — without image:** Body → raw → JSON:

```json
{
  "name": "Test Phone Updated",
  "price": 899,
  "stock": 25
}
```

**Sample response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "6ac09276f22f2b3f1e17bbcc",
    "name": "Test Phone Updated",
    "price": 899,
    "stock": 25,
    "category": "Electronics",
    "description": "A test product",
    "image": "http://localhost:5000/uploads/1791005309753-524481753.png",
    "createdAt": "2026-10-03T05:28:22.458Z",
    "updatedAt": "2026-10-03T05:28:29.859Z",
    "__v": 0
  }
}
```

---

### 5. Delete Product — `DELETE /api/products/:id`

Deletes the database record **and** the image file from the `uploads/` folder.

**Sample response (200):**

```json
{
  "success": true,
  "message": "Product and associated image deleted",
  "data": {}
}
```

**Errors:** `400` invalid id, `404` product not found.

---

### 6. Serve Uploaded Images — `GET /uploads/<filename>`

Static route via `express.static()`.

```
http://localhost:5000/uploads/1791005302426-260594333.png
```

---

## Postman Testing Checklist

1. `GET` `http://localhost:5000/api/products` → 200, empty list
2. `POST` `http://localhost:5000/api/products` (form-data + image) → 201, product created
3. `POST` with a `.txt` file → 400, file type rejected
4. `GET /api/products/:id` → 200, single product
5. `PUT /api/products/:id` (form-data + new image) → 200, old file removed from `uploads/`
6. `PUT` with raw JSON only → 200, fields updated
7. `DELETE /api/products/:id` → 200, record + image file removed
8. Open the `image` URL in browser → 200 image renders
