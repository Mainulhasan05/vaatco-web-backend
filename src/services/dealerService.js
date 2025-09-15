const Dealer = require("../models/Dealer");

class DealerService {
  // CREATE
  static async createDealer(dealerData, createdBy) {
    const dealer = new Dealer({
      ...dealerData,
      createdBy,
    });

    await dealer.save();
    return dealer.populate("createdBy", "name");
  }

  // READ (Public API with search, pagination, filter)
  static async getDealersPublic(filters = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      isVerified,
      isFeatured,
      location,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = { isActive: true };

    // Search by name, shopName, location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Filter by verified
    if (isVerified !== undefined) {
      query.isVerified = isVerified;
    }

    // Filter by featured
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const dealers = await Dealer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select("-createdBy -updatedBy -notes");

    const total = await Dealer.countDocuments(query);

    return {
      dealers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit), // Changed from "pages"
        totalItems: total, // Added this
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // READ (Single dealer by ID - public)
  static async getDealerByIdPublic(id) {
    const dealer = await Dealer.findOne({ _id: id, isActive: true }).select(
      "-createdBy -updatedBy -notes"
    );

    if (!dealer) {
      throw new Error("Dealer not found");
    }

    return dealer;
  }

  // READ (Admin - all dealers with filters)
  static async getAllDealers(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      isVerified,
      isFeatured,
      location,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (isActive !== undefined) query.isActive = isActive;
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const dealers = await Dealer.find(query)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Dealer.countDocuments(query);

    return {
      dealers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // READ (Single dealer by ID - admin)
  static async getDealerById(id) {
    const dealer = await Dealer.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!dealer) {
      throw new Error("Dealer not found");
    }
    return dealer;
  }

  // UPDATE
  static async updateDealer(id, updateData, updatedBy) {
    const dealer = await Dealer.findById(id);
    if (!dealer) {
      throw new Error("Dealer not found");
    }

    const updatedDealer = await Dealer.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy },
      { new: true, runValidators: true }
    ).populate("updatedBy", "name");

    return updatedDealer;
  }

  // DELETE
  static async deleteDealer(id) {
    const dealer = await Dealer.findById(id);
    if (!dealer) {
      throw new Error("Dealer not found");
    }

    await Dealer.findByIdAndDelete(id);
    return { message: "Dealer deleted successfully" };
  }
}

module.exports = DealerService;
