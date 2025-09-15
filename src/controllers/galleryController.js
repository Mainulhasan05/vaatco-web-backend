const GalleryService = require("../services/galleryService");
const ResponseHelper = require("../utils/responseHelper");

class GalleryController {
  /**
   * Upload single image
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return ResponseHelper.validationError(res, {
          image: "Image file is required",
        });
      }

      const image = await GalleryService.uploadImage(req.file, req.admin._id);

      return ResponseHelper.created(res, image, "Image uploaded successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return ResponseHelper.validationError(res, {
          images: "At least one image file is required",
        });
      }

      const images = await GalleryService.uploadMultipleImages(
        req.files,
        req.admin._id
      );

      return ResponseHelper.created(
        res,
        images,
        `${images.length} images uploaded successfully`
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get all images with pagination and filters
   */
  static async getAllImages(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 200,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === "true"
            : undefined,
        isFeatured:
          req.query.isFeatured !== undefined
            ? req.query.isFeatured === "true"
            : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await GalleryService.getAllImages(filters);

      return ResponseHelper.paginated(
        res,
        result.images,
        result.pagination,
        "Images retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get image by ID
   */
  static async getImageById(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryService.getImageById(id);

      return ResponseHelper.success(res, image, "Image retrieved successfully");
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Update image
   */
  static async updateImage(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryService.updateImage(id, req.body);

      return ResponseHelper.updated(res, image, "Image updated successfully");
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const result = await GalleryService.deleteImage(id);

      return ResponseHelper.deleted(res, result.message);
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get featured images
   */
  static async getFeaturedImages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const images = await GalleryService.getFeaturedImages(limit);

      return ResponseHelper.success(
        res,
        images,
        "Featured images retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  static async getPublicFeaturedImages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const images = await GalleryService.getPublicFeaturedImages(limit);

      return ResponseHelper.success(
        res,
        images,
        "Featured images retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get images for selection (admin use)
   */
  static async getImagesForSelection(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const images = await GalleryService.getImagesForSelection(limit);

      return ResponseHelper.success(
        res,
        images,
        "Images for selection retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Toggle active status
   */
  static async toggleActiveStatus(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryService.toggleActiveStatus(id);

      return ResponseHelper.updated(
        res,
        image,
        `Image ${image.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Toggle featured status
   */
  static async toggleFeaturedStatus(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryService.toggleFeaturedStatus(id);

      return ResponseHelper.updated(
        res,
        image,
        `Image ${image.isFeatured ? "featured" : "unfeatured"} successfully`
      );
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(req, res) {
    try {
      const { id } = req.params;
      const image = await GalleryService.incrementUsage(id);

      return ResponseHelper.success(
        res,
        { usageCount: image.usageCount, lastUsed: image.lastUsed },
        "Image usage incremented successfully"
      );
    } catch (error) {
      if (error.message === "Image not found") {
        return ResponseHelper.notFound(res, "Image");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Bulk update images
   */
  static async bulkUpdateImages(req, res) {
    try {
      const { imageIds, updateData } = req.body;

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        return ResponseHelper.validationError(res, {
          imageIds: "At least one image ID is required",
        });
      }

      const result = await GalleryService.bulkUpdateImages(
        imageIds,
        updateData
      );

      return ResponseHelper.success(res, result, result.message);
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Bulk delete images
   */
  static async bulkDeleteImages(req, res) {
    try {
      const { imageIds } = req.body;

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        return ResponseHelper.validationError(res, {
          imageIds: "At least one image ID is required",
        });
      }

      const result = await GalleryService.bulkDeleteImages(imageIds);

      return ResponseHelper.success(res, result, result.message);
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats(req, res) {
    try {
      const stats = await GalleryService.getUsageStats();

      return ResponseHelper.success(
        res,
        stats,
        "Usage statistics retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Update sort order for multiple images
   */
  static async updateSortOrder(req, res) {
    try {
      const { sortOrderData } = req.body;

      if (!sortOrderData || !Array.isArray(sortOrderData)) {
        return ResponseHelper.validationError(res, {
          sortOrderData: "Sort order data array is required",
        });
      }

      const result = await GalleryService.updateSortOrder(sortOrderData);

      return ResponseHelper.success(res, result, result.message);
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get images by usage count
   */
  static async getImagesByUsage(req, res) {
    try {
      const minUsage = parseInt(req.query.minUsage) || 0;
      const limit = parseInt(req.query.limit) || 20;

      const images = await GalleryService.getImagesByUsage(minUsage, limit);

      return ResponseHelper.success(
        res,
        images,
        "Images retrieved by usage successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Get recently uploaded images
   */
  static async getRecentImages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const images = await GalleryService.getRecentImages(limit);

      return ResponseHelper.success(
        res,
        images,
        "Recent images retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }
}

module.exports = GalleryController;
