const Blog = require("../models/Blog");
const slugify = require("slugify");

class BlogService {
  // Generate unique slug
  static async generateUniqueSlug(title, excludeId = null) {
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingBlog = await Blog.findOne(query);
      if (!existingBlog) break;

      const randomNum = Math.floor(Math.random() * 1000) + counter;
      slug = `${baseSlug}-${randomNum}`;
      counter++;
    }
    return slug;
  }

  // Calculate read time based on content
  static calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // CREATE
  static async createBlog(blogData, author) {
    const slug = await this.generateUniqueSlug(blogData.title);
    const readTime = this.calculateReadTime(blogData.content);

    // Auto-set publish date if status is published
    if (blogData.status === "published" && !blogData.publishDate) {
      blogData.publishDate = new Date();
    }

    const blog = new Blog({
      ...blogData,
      slug,
      readTime,
      author,
    });

    await blog.save();
    return blog.populate("author", "name");
  }

  // READ (Public API with search, pagination, filter)
  static async getBlogsPublic(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      isFeatured,
      sortBy = "publishDate",
      sortOrder = "desc",
    } = filters;

    let query = {
      status: "published",
      publishDate: { $lte: new Date() },
    };

    // Search in title, excerpt, content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Filter by featured
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select(
        "title slug excerpt featuredImage tags publishDate readTime views likes author isFeatured"
      );

    const total = await Blog.countDocuments(query);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // READ (Single blog by slug - public)
  static async getBlogBySlug(slug) {
    const blog = await Blog.findOne({
      slug,
      status: "published",
      publishDate: { $lte: new Date() },
    }).populate("author", "name");

    if (!blog) {
      throw new Error("Blog not found");
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    return blog;
  }

  // READ (Admin - all blogs with filters)
  static async getAllBlogs(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      isFeatured,
      author,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (author) query.author = author;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .populate("lastModifiedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // READ (Single blog by ID - admin)
  static async getBlogById(id) {
    const blog = await Blog.findById(id)
      .populate("author", "name")
      .populate("lastModifiedBy", "name");

    if (!blog) {
      throw new Error("Blog not found");
    }
    return blog;
  }

  // UPDATE
  static async updateBlog(id, updateData, lastModifiedBy) {
    const blog = await Blog.findById(id);
    if (!blog) {
      throw new Error("Blog not found");
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== blog.title) {
      updateData.slug = await this.generateUniqueSlug(updateData.title, id);
    }

    // Recalculate read time if content changed
    if (updateData.content && updateData.content !== blog.content) {
      updateData.readTime = this.calculateReadTime(updateData.content);
    }

    // Auto-set publish date if status changes to published
    if (
      updateData.status === "published" &&
      blog.status !== "published" &&
      !updateData.publishDate
    ) {
      updateData.publishDate = new Date();
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { ...updateData, lastModifiedBy },
      { new: true, runValidators: true }
    ).populate("lastModifiedBy", "name");

    return updatedBlog;
  }

  // DELETE
  static async deleteBlog(id) {
    const blog = await Blog.findById(id);
    if (!blog) {
      throw new Error("Blog not found");
    }

    await Blog.findByIdAndDelete(id);
    return { message: "Blog deleted successfully" };
  }
}

module.exports = BlogService;
