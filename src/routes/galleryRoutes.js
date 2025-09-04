const express = require("express");
const GalleryController = require("../controllers/galleryController");
const { protect, checkPermission } = require("../middleware/auth");
const { uploadGallery } = require("../config/cloudinary");

const router = express.Router();

// Public routes (for frontend to fetch images)
router.get("/", GalleryController.getAllImages);
router.get("/featured", GalleryController.getFeaturedImages);
router.get("/recent", GalleryController.getRecentImages);
router.get("/by-usage", GalleryController.getImagesByUsage);
router.get("/stats", GalleryController.getUsageStats);
router.get("/:id", GalleryController.getImageById);

// Protected routes (require authentication)
router.use(protect);

// Admin routes with permission checks
router.post(
  "/upload",
  //   checkPermission("gallery", "create"),
  uploadGallery.single("image"),
  GalleryController.uploadImage
);

router.post(
  "/upload/multiple",
  checkPermission("gallery", "create"),
  uploadGallery.array("images", 10),
  GalleryController.uploadMultipleImages
);

router.put(
  "/:id",
  checkPermission("gallery", "update"),
  GalleryController.updateImage
);

router.patch(
  "/:id/toggle-active",
  checkPermission("gallery", "update"),
  GalleryController.toggleActiveStatus
);

router.patch(
  "/:id/toggle-featured",
  checkPermission("gallery", "update"),
  GalleryController.toggleFeaturedStatus
);

router.patch("/:id/increment-usage", GalleryController.incrementUsage);

router.delete(
  "/:id",
  checkPermission("gallery", "delete"),
  GalleryController.deleteImage
);

// Bulk operations
router.put(
  "/bulk/update",
  checkPermission("gallery", "update"),
  GalleryController.bulkUpdateImages
);

router.delete(
  "/bulk/delete",
  checkPermission("gallery", "delete"),
  GalleryController.bulkDeleteImages
);

router.put(
  "/sort-order",
  checkPermission("gallery", "update"),
  GalleryController.updateSortOrder
);

// Selection routes for content management
router.get("/admin/selection", GalleryController.getImagesForSelection);

module.exports = router;
