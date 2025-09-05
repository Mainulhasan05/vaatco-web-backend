const ProductService = require("../services/productService");
const ResponseHelper = require("../utils/responseHelper");

class ProductController {
  // PUBLIC API - Get products with search, pagination, filter
  static async getProductsPublic(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 12,
        search: req.query.search,
        isFeatured:
          req.query.featured === "true"
            ? true
            : req.query.featured === "false"
            ? false
            : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await ProductService.getProductsPublic(filters);

      return ResponseHelper.paginated(
        res,
        result.products,
        result.pagination,
        "Products retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // PUBLIC API - Get single product by slug
  static async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;
      const product = await ProductService.getProductBySlug(slug);

      return ResponseHelper.success(
        res,
        product,
        "Product retrieved successfully"
      );
    } catch (error) {
      if (error.message === "Product not found") {
        return ResponseHelper.notFound(res, "Product");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get all products
  static async getAllProducts(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
            ? false
            : undefined,
        isFeatured:
          req.query.isFeatured === "true"
            ? true
            : req.query.isFeatured === "false"
            ? false
            : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await ProductService.getAllProducts(filters);

      return ResponseHelper.paginated(
        res,
        result.products,
        result.pagination,
        "Products retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get single product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      return ResponseHelper.success(
        res,
        product,
        "Product retrieved successfully"
      );
    } catch (error) {
      if (error.message === "Product not found") {
        return ResponseHelper.notFound(res, "Product");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Create product
  static async createProduct(req, res) {
    try {
      const product = await ProductService.createProduct(
        req.body,
        req.admin._id
      );

      return ResponseHelper.created(
        res,
        product,
        "Product created successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(
        id,
        req.body,
        req.admin._id
      );

      return ResponseHelper.updated(
        res,
        product,
        "Product updated successfully"
      );
    } catch (error) {
      if (error.message === "Product not found") {
        return ResponseHelper.notFound(res, "Product");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);

      return ResponseHelper.deleted(res, result.message);
    } catch (error) {
      if (error.message === "Product not found") {
        return ResponseHelper.notFound(res, "Product");
      }
      return ResponseHelper.error(res, error.message);
    }
  }
}

module.exports = ProductController;
