const router = require("express").Router();
const GalleryController = require("../controllers/galleryController");
const ProductController = require("../controllers/productController");

// Public routes
router.get("/products", ProductController.getProductsPublic);
router.get("/public/:slug", ProductController.getProductBySlug);
// Public routes
router.get("/images", GalleryController.getPublicFeaturedImages);
router.get("/gallery/:id", GalleryController.getImageById);

module.exports = router;
