const BlogService = require("../services/blogService");
const ResponseHelper = require("../utils/responseHelper");

class BlogController {
  // PUBLIC API - Get blogs with search, pagination, filter
  static async getBlogsPublic(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        tags: req.query.tags ? req.query.tags.split(",") : undefined,
        isFeatured:
          req.query.featured === "true"
            ? true
            : req.query.featured === "false"
            ? false
            : undefined,
        sortBy: req.query.sortBy || "publishDate",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await BlogService.getBlogsPublic(filters);

      return ResponseHelper.paginated(
        res,
        result.blogs,
        result.pagination,
        "Blogs retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // PUBLIC API - Get single blog by slug
  static async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;
      const blog = await BlogService.getBlogBySlug(slug);

      return ResponseHelper.success(res, blog, "Blog retrieved successfully");
    } catch (error) {
      if (error.message === "Blog not found") {
        return ResponseHelper.notFound(res, "Blog");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get all blogs
  static async getAllBlogs(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        status: req.query.status,
        isFeatured:
          req.query.isFeatured === "true"
            ? true
            : req.query.isFeatured === "false"
            ? false
            : undefined,
        author: req.query.author,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await BlogService.getAllBlogs(filters);

      return ResponseHelper.paginated(
        res,
        result.blogs,
        result.pagination,
        "Blogs retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get single blog by ID
  static async getBlogById(req, res) {
    try {
      const { id } = req.params;
      const blog = await BlogService.getBlogById(id);

      return ResponseHelper.success(res, blog, "Blog retrieved successfully");
    } catch (error) {
      if (error.message === "Blog not found") {
        return ResponseHelper.notFound(res, "Blog");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Create blog
  static async createBlog(req, res) {
    try {
      const blog = await BlogService.createBlog(req.body, req.admin._id);

      return ResponseHelper.created(res, blog, "Blog created successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Update blog
  static async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const blog = await BlogService.updateBlog(id, req.body, req.admin._id);

      return ResponseHelper.updated(res, blog, "Blog updated successfully");
    } catch (error) {
      if (error.message === "Blog not found") {
        return ResponseHelper.notFound(res, "Blog");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Delete blog
  static async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      const result = await BlogService.deleteBlog(id);

      return ResponseHelper.deleted(res, result.message);
    } catch (error) {
      if (error.message === "Blog not found") {
        return ResponseHelper.notFound(res, "Blog");
      }
      return ResponseHelper.error(res, error.message);
    }
  }
}

module.exports = BlogController;
