const Product = require("../models/Product");
const slugify = require("slugify");

class ProductService {
  // Generate unique slug
  static async generateUniqueSlug(name, excludeId = null) {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingProduct = await Product.findOne(query);
      if (!existingProduct) break;

      const randomNum = Math.floor(Math.random() * 1000) + counter;
      slug = `${baseSlug}-${randomNum}`;
      counter++;
    }
    return slug;
  }

  // CREATE
  static async createProduct(productData, createdBy) {
    const slug = await this.generateUniqueSlug(productData.name);

    const product = new Product({
      ...productData,
      slug,
      createdBy,
    });

    await product.save();
    return product.populate("createdBy", "name");
  }

  // READ (Public API with search, pagination, filter)
  static async getProductsPublic(filters = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = { isActive: true };

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by featured
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select("-createdBy -updatedBy");

    const total = await Product.countDocuments(query);

    return {
      products,
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

  // READ (Single product by slug - public)
  static async getProductBySlug(slug) {
    const product = await Product.findOne({ slug, isActive: true }).select(
      "-createdBy -updatedBy"
    );

    if (!product) {
      throw new Error("Product not found");
    }

    // Increment views
    product.views += 1;
    await product.save();

    return product;
  }

  // READ (Admin - all products with filters)
  static async getAllProducts(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) query.isActive = isActive;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // READ (Single product by ID - admin)
  static async getProductById(id) {
    const product = await Product.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  // UPDATE
  static async updateProduct(id, updateData, updatedBy) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    // Update slug if name changed
    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = await this.generateUniqueSlug(updateData.name, id);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy },
      { new: true, runValidators: true }
    ).populate("updatedBy", "name");

    return updatedProduct;
  }

  // DELETE
  static async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    await Product.findByIdAndDelete(id);
    return { message: "Product deleted successfully" };
  }
}

module.exports = ProductService;
