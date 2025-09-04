const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    excerpt: {
      type: String,
      required: [true, "Blog excerpt is required"],
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    featuredImage: {
      url: String,
      public_id: String,
      alt: String,
    },
    category: {
      type: String,
      enum: [
        "aquaculture",
        "fish_health",
        "water_management",
        "pond_care",
        "nutrition",
        "disease_prevention",
        "farming_tips",
        "product_guide",
        "industry_news",
        "research",
        "case_study",
        "others",
      ],
      required: [true, "Blog category is required"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishDate: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    readTime: {
      type: Number, // in minutes
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
    relatedProducts: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    tableOfContents: [
      {
        heading: String,
        level: {
          type: Number,
          min: 1,
          max: 6,
        },
        anchor: String,
      },
    ],
    lastModifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ publishDate: -1 });
blogSchema.index({ isFeatured: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: "text", excerpt: "text", content: "text" });

// Virtual for formatted publish date
blogSchema.virtual("formattedPublishDate").get(function () {
  if (!this.publishDate) return null;
  return this.publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Pre-save middleware to generate slug
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Calculate read time based on content length
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }

  // Auto-set publish date when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishDate
  ) {
    this.publishDate = new Date();
  }

  next();
});

// Static method to get published blogs
blogSchema.statics.getPublishedBlogs = function (page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  return this.find({
    status: "published",
    publishDate: { $lte: new Date() },
  })
    .populate("author", "name")
    .populate("relatedProducts", "name slug primaryImage")
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "title slug excerpt featuredImage category tags publishDate readTime views likes author"
    );
};

// Static method to get featured blogs
blogSchema.statics.getFeaturedBlogs = function (limit = 5) {
  return this.find({
    status: "published",
    isFeatured: true,
    publishDate: { $lte: new Date() },
  })
    .populate("author", "name")
    .sort({ publishDate: -1 })
    .limit(limit)
    .select(
      "title slug excerpt featuredImage category publishDate readTime views author"
    );
};

// Static method to get blogs by category
blogSchema.statics.getBlogsByCategory = function (
  category,
  page = 1,
  limit = 10
) {
  const skip = (page - 1) * limit;

  return this.find({
    status: "published",
    category,
    publishDate: { $lte: new Date() },
  })
    .populate("author", "name")
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "title slug excerpt featuredImage category tags publishDate readTime views likes author"
    );
};

// Static method to search blogs
blogSchema.statics.searchBlogs = function (searchParams) {
  const { search, category, tags, page = 1, limit = 10 } = searchParams;

  let query = {
    status: "published",
    publishDate: { $lte: new Date() },
  };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate("author", "name")
    .sort({ publishDate: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "title slug excerpt featuredImage category tags publishDate readTime views likes author"
    );
};

// Static method to get related blogs
blogSchema.statics.getRelatedBlogs = function (
  blogId,
  category,
  tags,
  limit = 3
) {
  return this.find({
    _id: { $ne: blogId },
    status: "published",
    publishDate: { $lte: new Date() },
    $or: [{ category: category }, { tags: { $in: tags } }],
  })
    .populate("author", "name")
    .sort({ publishDate: -1 })
    .limit(limit)
    .select(
      "title slug excerpt featuredImage category publishDate readTime views author"
    );
};

// Instance method to increment views
blogSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to increment likes
blogSchema.methods.incrementLikes = function () {
  this.likes += 1;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model("Blog", blogSchema);
