const express = require("express");
const BlogController = require("../controllers/blogController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES (no auth required)
router.get("/", BlogController.getAllBlogs);
router.get("/public", BlogController.getBlogsPublic);
router.get("/public/:slug", BlogController.getBlogBySlug);
router.get("/:id", BlogController.getBlogById);

// ADMIN ROUTES (protected)
router.use(protect);

router.post("/", BlogController.createBlog);
router.put("/:id", BlogController.updateBlog);
router.delete("/:id", BlogController.deleteBlog);

module.exports = router;
