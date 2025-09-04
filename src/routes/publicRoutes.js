const router = require("express").Router();
const GalleryController = require("../controllers/galleryController");

// Public routes
router.get("/images", GalleryController.getPublicFeaturedImages);
router.get("/gallery/:id", GalleryController.getImageById);

module.exports = router;
