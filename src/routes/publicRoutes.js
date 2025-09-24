const router = require("express").Router();
const GalleryController = require("../controllers/galleryController");
const ProductController = require("../controllers/productController");
const DealerController = require("../controllers/dealerController");
const BlogController = require("../controllers/blogController");

// Public routes
router.get("/products", ProductController.getProductsPublic);
router.get("/dealers", DealerController.getDealersPublic);
router.get("/public/:slug", ProductController.getProductBySlug);
// Public routes
router.get("/images", GalleryController.getPublicFeaturedImages);
router.get("/gallery/:id", GalleryController.getImageById);
// Public routes
router.get("/blogs", BlogController.getBlogsPublic);
router.get("/blog/:slug", BlogController.getBlogBySlug);

module.exports = router;
