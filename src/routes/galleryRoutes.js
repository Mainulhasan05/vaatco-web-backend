const express = require("express");
const GalleryController = require("../controllers/galleryController");
const { protect } = require("../middleware/auth");
const { uploadGallery } = require("../config/cloudinary");

const router = express.Router();

// Public routes (for frontend to fetch images)

router.get("/featured", GalleryController.getFeaturedImages);
router.get("/recent", GalleryController.getRecentImages);
router.get("/by-usage", GalleryController.getImagesByUsage);
router.get("/stats", GalleryController.getUsageStats);
router.get("/:id", GalleryController.getImageById);

// Protected routes (require authentication)
router.use(protect);
router.get("/", GalleryController.getAllImages);
// Admin routes with permission checks
router.post(
  "/upload",
  //
  uploadGallery.single("image"),
  GalleryController.uploadImage
);

router.post(
  "/upload/multiple",

  uploadGallery.array("images", 10),
  GalleryController.uploadMultipleImages
);

router.put(
  "/:id",

  GalleryController.updateImage
);

router.patch(
  "/:id/toggle-active",

  GalleryController.toggleActiveStatus
);

router.patch(
  "/:id/toggle-featured",

  GalleryController.toggleFeaturedStatus
);

router.patch("/:id/increment-usage", GalleryController.incrementUsage);

router.delete("/:id", GalleryController.deleteImage);

// Bulk operations
router.put(
  "/bulk/update",

  GalleryController.bulkUpdateImages
);

router.delete(
  "/bulk/delete",

  GalleryController.bulkDeleteImages
);

router.put(
  "/sort-order",

  GalleryController.updateSortOrder
);

// Selection routes for content management
router.get("/admin/selection", GalleryController.getImagesForSelection);

module.exports = router;
