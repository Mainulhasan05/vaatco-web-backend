const express = require("express");
const ProductController = require("../controllers/productController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES
router.get("/products", ProductController.getProductsPublic);
router.get("/public/:slug", ProductController.getProductBySlug);

// ADMIN ROUTES (protected)
router.use(protect);

// CRUD operations
router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);
router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
