const Product = require("../models/Product");
const Category = require("../models/Category");
const Gallery = require("../models/Gallery");
const { deleteImage } = require("../config/cloudinary");

class ProductService {
  /**
   * Get all products with pagination and filters
   */
  static async getAllProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        search,
        isActive,
        isFeatured,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      let query = {};

      // Apply filters
      if (category) {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search };
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (isFeatured !== undefined) {
        query.isFeatured = isFeatured;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const products = await Product.find(query)
        .populate("category", "name slug")
        .populate("createdBy", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      return {
        products,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalProducts,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single product by ID or slug
   */
  static async getProductById(identifier, incrementViews = false) {
    try {
      let product;

      // Check if identifier is ObjectId or slug
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(identifier);
      } else {
        product = await Product.findOne({ slug: identifier });
      }

      if (!product) {
        throw new Error("Product not found");
      }

      // Populate related data
      await product.populate([
        { path: "category", select: "name slug" },
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
      ]);

      // Increment views if requested
      if (incrementViews) {
        await product.incrementViews();
      }

      // Get related products
      const relatedProducts = await product.getRelatedProducts(4);

      return {
        product,
        relatedProducts,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new product
   */
  static async createProduct(productData, createdBy) {
    try {
      // Verify category exists
      const category = await Category.findById(productData.category);
      if (!category) {
        throw new Error("Category not found");
      }

      // Process images from gallery
      if (productData.imageIds && productData.imageIds.length > 0) {
        const images = await Gallery.find({
          _id: { $in: productData.imageIds },
          isActive: true,
        });

        productData.images = images.map((img, index) => ({
          url: img.image.url,
          public_id: img.image.public_id,
          alt: img.title,
          isPrimary: index === 0,
        }));

        // Increment usage count for selected images
        await Promise.all(images.map((img) => img.incrementUsage()));
      }

      const product = new Product({
        ...productData,
        createdBy,
      });

      await product.save();

      // Populate before returning
      await product.populate([
        { path: "category", select: "name slug" },
        { path: "createdBy", select: "name" },
      ]);

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId, updateData, updatedBy) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Verify category if being updated
      if (updateData.category) {
        const category = await Category.findById(updateData.category);
        if (!category) {
          throw new Error("Category not found");
        }
      }

      // Handle image updates
      if (updateData.imageIds) {
        const images = await Gallery.find({
          _id: { $in: updateData.imageIds },
          isActive: true,
        });

        updateData.images = images.map((img, index) => ({
          url: img.image.url,
          public_id: img.image.public_id,
          alt: img.title,
          isPrimary: index === 0,
        }));

        // Increment usage count for new images
        await Promise.all(images.map((img) => img.incrementUsage()));
      }

      // Add updatedBy field
      updateData.updatedBy = updatedBy;

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      await updatedProduct.populate([
        { path: "category", select: "name slug" },
        { path: "updatedBy", select: "name" },
      ]);

      return updatedProduct;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      await Product.findByIdAndDelete(productId);

      return { message: "Product deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle product active status
   */
  static async toggleActiveStatus(productId, updatedBy) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      product.isActive = !product.isActive;
      product.updatedBy = updatedBy;
      await product.save();

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle product featured status
   */
  static async toggleFeaturedStatus(productId, updatedBy) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      product.isFeatured = !product.isFeatured;
      product.updatedBy = updatedBy;
      await product.save();

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 8) {
    try {
      const products = await Product.getFeaturedProducts(limit);
      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId, page = 1, limit = 12) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      const products = await Product.getByCategory(categoryId, page, limit);
      const totalProducts = await Product.countDocuments({
        category: categoryId,
        isActive: true,
      });
      const totalPages = Math.ceil(totalProducts / limit);

      return {
        products,
        category,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalProducts,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search products
   */
  static async searchProducts(searchTerm, filters = {}) {
    try {
      const { page = 1, limit = 12, category, sortBy = "relevance" } = filters;

      let query = {
        isActive: true,
        $text: { $search: searchTerm },
      };

      if (category) {
        query.category = category;
      }

      const skip = (page - 1) * limit;
      let sortOptions = {};

      if (sortBy === "relevance") {
        sortOptions = { score: { $meta: "textScore" } };
      } else {
        sortOptions[sortBy] = -1;
      }

      const products = await Product.find(query, {
        score: { $meta: "textScore" },
      })
        .populate("category", "name slug")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      return {
        products,
        searchTerm,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalProducts,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update products
   */
  static async bulkUpdateProducts(productIds, updateData, updatedBy) {
    try {
      const allowedFields = ["isActive", "isFeatured", "category"];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      updates.updatedBy = updatedBy;

      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        updates
      );

      return {
        message: `${result.modifiedCount} products updated successfully`,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats() {
    try {
      const [
        totalProducts,
        activeProducts,
        featuredProducts,
        categoryStats,
        topViewedProducts,
      ] = await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isFeatured: true }),
        Product.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $project: {
              categoryName: { $arrayElemAt: ["$category.name", 0] },
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),
        Product.find({ isActive: true })
          .sort({ views: -1 })
          .limit(5)
          .select("name views slug"),
      ]);

      return {
        total: totalProducts,
        active: activeProducts,
        featured: featuredProducts,
        categoryStats,
        topViewedProducts,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductService;
