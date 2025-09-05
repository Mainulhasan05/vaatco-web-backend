const express = require("express");
const BlogController = require("../controllers/blogController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES
router.get("/public", BlogController.getBlogsPublic);
router.get("/public/:slug", BlogController.getBlogBySlug);

// ADMIN ROUTES (protected)
router.use(protect);

// CRUD operations
router.get("/", checkPermission("blogs", "read"), BlogController.getAllBlogs);
router.get(
  "/:id",

  BlogController.getBlogById
);
router.post("/", BlogController.createBlog);
router.put(
  "/:id",

  BlogController.updateBlog
);
router.delete(
  "/:id",

  BlogController.deleteBlog
);

module.exports = router;
