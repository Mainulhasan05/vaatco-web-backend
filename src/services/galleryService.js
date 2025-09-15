const Gallery = require("../models/Gallery");
const { deleteImage } = require("../config/cloudinary");

class GalleryService {
  /**
   * Upload single image
   */
  static async uploadImage(fileData, uploadedBy) {
    try {
      const image = new Gallery({
        image: {
          url: fileData.path,
          public_id: fileData.filename,
        },
        uploadedBy,
      });

      await image.save();

      await image.populate("uploadedBy", "name");
      return image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(filesData, uploadedBy) {
    try {
      const imagesData = filesData.map((file) => ({
        image: {
          url: file.path,
          public_id: file.filename,
        },
        uploadedBy,
      }));

      const uploadedImages = await Gallery.insertMany(imagesData);

      // Populate uploaded by info
      await Gallery.populate(uploadedImages, {
        path: "uploadedBy",
        select: "name",
      });

      return uploadedImages;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all images with filters and pagination
   */
  static async getAllImages(filters = {}) {
    try {
      const {
        page = 1,
        limit = 200,
        isActive,
        isFeatured,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      let query = {};

      // Apply filters
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (isFeatured !== undefined) {
        query.isFeatured = isFeatured;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const images = await Gallery.find(query)
        .populate("uploadedBy", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const totalImages = await Gallery.countDocuments(query);
      const totalPages = Math.ceil(totalImages / limit);

      return {
        images,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalImages,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get image by ID
   */
  static async getImageById(imageId) {
    try {
      const image = await Gallery.findById(imageId).populate(
        "uploadedBy",
        "name"
      );

      if (!image) {
        throw new Error("Image not found");
      }

      return image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update image
   */
  static async updateImage(imageId, updateData) {
    try {
      const image = await Gallery.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      const allowedUpdates = ["isFeatured", "isActive", "sortOrder"];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      const updatedImage = await Gallery.findByIdAndUpdate(imageId, updates, {
        new: true,
        runValidators: true,
      });

      await updatedImage.populate("uploadedBy", "name");

      return updatedImage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete image
   */
  static async deleteImage(imageId) {
    try {
      const image = await Gallery.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from Cloudinary
      if (image.image.public_id) {
        try {
          await deleteImage(image.image.public_id);
        } catch (cloudinaryError) {
          console.error("Error deleting from Cloudinary:", cloudinaryError);
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }

      await Gallery.findByIdAndDelete(imageId);

      return { message: "Image deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured images
   */
  static async getFeaturedImages(limit = 12) {
    try {
      const images = await Gallery.find({
        isActive: true,
        isFeatured: true,
      })
        .populate("uploadedBy", "name")
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(limit);

      return images;
    } catch (error) {
      throw error;
    }
  }

  static async getPublicFeaturedImages(limit = 12) {
    try {
      // only return the image url as a string array, sorted by sortOrder
      const images = await Gallery.find({
        isActive: true,
        isFeatured: true,
      })
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(limit);

      // Transform the response to only include the image URL as a string array
      const imageUrls = images.map((image) => image.image.url);

      return imageUrls;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active images for selection (admin use)
   */
  static async getImagesForSelection(limit = 50) {
    try {
      const images = await Gallery.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("image createdAt");

      return images;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle active status
   */
  static async toggleActiveStatus(imageId) {
    try {
      const image = await Gallery.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      image.isActive = !image.isActive;
      await image.save();

      await image.populate("uploadedBy", "name");
      return image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle featured status
   */
  static async toggleFeaturedStatus(imageId) {
    try {
      const image = await Gallery.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      image.isFeatured = !image.isFeatured;
      await image.save();

      await image.populate("uploadedBy", "name");
      return image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(imageId) {
    try {
      const image = await Gallery.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      image.usageCount += 1;
      image.lastUsed = new Date();
      await image.save({ validateBeforeSave: false });

      return image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update images
   */
  static async bulkUpdateImages(imageIds, updateData) {
    try {
      const allowedFields = ["isActive", "isFeatured", "sortOrder"];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      const result = await Gallery.updateMany(
        { _id: { $in: imageIds } },
        updates
      );

      return {
        message: `${result.modifiedCount} images updated successfully`,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk delete images
   */
  static async bulkDeleteImages(imageIds) {
    try {
      // Get images to delete
      const images = await Gallery.find({ _id: { $in: imageIds } });

      // Delete from Cloudinary
      const deletePromises = images.map((image) => {
        if (image.image.public_id) {
          return deleteImage(image.image.public_id).catch((error) => {
            console.error(
              `Error deleting ${image.image.public_id} from Cloudinary:`,
              error
            );
            return null; // Continue with other deletions
          });
        }
        return Promise.resolve();
      });

      await Promise.allSettled(deletePromises);

      // Delete from database
      const result = await Gallery.deleteMany({ _id: { $in: imageIds } });

      return {
        message: `${result.deletedCount} images deleted successfully`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats() {
    try {
      const totalImages = await Gallery.countDocuments({});
      const activeImages = await Gallery.countDocuments({ isActive: true });
      const featuredImages = await Gallery.countDocuments({ isFeatured: true });

      const usageStats = await Gallery.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: "$usageCount" },
            avgUsage: { $avg: "$usageCount" },
            maxUsage: { $max: "$usageCount" },
            minUsage: { $min: "$usageCount" },
          },
        },
      ]);

      const mostUsedImages = await Gallery.find({ usageCount: { $gt: 0 } })
        .sort({ usageCount: -1 })
        .limit(10)
        .select("image usageCount lastUsed")
        .populate("uploadedBy", "name");

      return {
        totalImages,
        activeImages,
        featuredImages,
        usage: usageStats[0] || {
          totalUsage: 0,
          avgUsage: 0,
          maxUsage: 0,
          minUsage: 0,
        },
        mostUsedImages,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update sort order for multiple images
   */
  static async updateSortOrder(sortOrderData) {
    try {
      const updatePromises = sortOrderData.map(({ id, sortOrder }) => {
        return Gallery.findByIdAndUpdate(id, { sortOrder }, { new: true });
      });

      const updatedImages = await Promise.all(updatePromises);

      return {
        message: `Sort order updated for ${updatedImages.length} images`,
        updatedImages,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search images by usage count
   */
  static async getImagesByUsage(minUsage = 0, limit = 20) {
    try {
      const images = await Gallery.find({
        isActive: true,
        usageCount: { $gte: minUsage },
      })
        .populate("uploadedBy", "name")
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(limit);

      return images;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recently uploaded images
   */
  static async getRecentImages(limit = 20) {
    try {
      const images = await Gallery.find({ isActive: true })
        .populate("uploadedBy", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

      return images;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = GalleryService;
