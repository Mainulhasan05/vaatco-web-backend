const express = require("express");
const ProductController = require("../controllers/productController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES (no auth required)
router.get("/", ProductController.getAllProducts);
router.get("/products", ProductController.getProductsPublic);
router.get("/public/:slug", ProductController.getProductBySlug);
router.get("/:id", ProductController.getProductById);

// ADMIN ROUTES (protected)
router.use(protect);

router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
