const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AdminService {
  /**
   * Authenticate admin login
   */
  static async loginAdmin(email, password) {
    try {
      // Find admin and include password for comparison
      const admin = await Admin.findOne({ email, isActive: true }).select(
        "+password"
      );

      if (!admin) {
        throw new Error("Invalid credentials");
      }

      // Check password
      const isPasswordMatch = await bcrypt.compare(password, admin.password);

      if (!isPasswordMatch) {
        throw new Error("Invalid credentials");
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save({ validateBeforeSave: false });

      // Generate JWT token
      const token = this.generateToken(admin._id);

      // Remove password from response
      admin.password = undefined;

      return {
        admin,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(adminId) {
    return jwt.sign({ adminId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  }

  /**
   * Get admin profile
   */
  static async getAdminProfile(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error("Admin not found");
      }
      return admin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update admin profile
   */
  static async updateAdminProfile(adminId, updateData) {
    try {
      const allowedUpdates = ["name", "phone", "profileImage"];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      const admin = await Admin.findByIdAndUpdate(adminId, updates, {
        new: true,
        runValidators: true,
      });

      if (!admin) {
        throw new Error("Admin not found");
      }

      return admin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change admin password
   */
  static async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await Admin.findById(adminId).select("+password");

      if (!admin) {
        throw new Error("Admin not found");
      }

      // Verify current password
      const isPasswordMatch = await admin.matchPassword(currentPassword);
      if (!isPasswordMatch) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      return { message: "Password updated successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new admin (Super admin only)
   */
  static async createAdmin(creatorId, adminData) {
    try {
      // Check if creator is super admin
      const creator = await Admin.findById(creatorId);
      if (!creator || creator.role !== "super_admin") {
        throw new Error("Only super admin can create new admins");
      }

      // Check if email already exists
      const existingAdmin = await Admin.findOne({ email: adminData.email });
      if (existingAdmin) {
        throw new Error("Admin with this email already exists");
      }

      const admin = new Admin({
        ...adminData,
        createdBy: creatorId,
      });

      await admin.save();
      return admin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all admins (Super admin only)
   */
  static async getAllAdmins(requesterId, page = 1, limit = 10) {
    try {
      // Check if requester is super admin
      const requester = await Admin.findById(requesterId);
      if (!requester || requester.role !== "super_admin") {
        throw new Error("Access denied. Super admin role required.");
      }

      const skip = (page - 1) * limit;

      const admins = await Admin.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password");

      const totalAdmins = await Admin.countDocuments({});
      const totalPages = Math.ceil(totalAdmins / limit);

      return {
        admins,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalAdmins,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update admin status (Super admin only)
   */
  static async updateAdminStatus(requesterId, adminId, status) {
    try {
      // Check if requester is super admin
      const requester = await Admin.findById(requesterId);
      if (!requester || requester.role !== "super_admin") {
        throw new Error("Access denied. Super admin role required.");
      }

      // Prevent deactivating self
      if (requesterId.toString() === adminId) {
        throw new Error("Cannot deactivate your own account");
      }

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        {
          isActive: status,
          updatedBy: requesterId,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!admin) {
        throw new Error("Admin not found");
      }

      return admin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update admin permissions (Super admin only)
   */
  static async updateAdminPermissions(requesterId, adminId, permissions) {
    try {
      // Check if requester is super admin
      const requester = await Admin.findById(requesterId);
      if (!requester || requester.role !== "super_admin") {
        throw new Error("Access denied. Super admin role required.");
      }

      // Cannot modify super admin permissions
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        throw new Error("Admin not found");
      }

      if (targetAdmin.role === "super_admin") {
        throw new Error("Cannot modify super admin permissions");
      }

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        {
          permissions,
          updatedBy: requesterId,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      return admin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete admin (Super admin only)
   */
  static async deleteAdmin(requesterId, adminId) {
    try {
      // Check if requester is super admin
      const requester = await Admin.findById(requesterId);
      if (!requester || requester.role !== "super_admin") {
        throw new Error("Access denied. Super admin role required.");
      }

      // Prevent deleting self
      if (requesterId.toString() === adminId) {
        throw new Error("Cannot delete your own account");
      }

      // Cannot delete super admin
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        throw new Error("Admin not found");
      }

      if (targetAdmin.role === "super_admin") {
        throw new Error("Cannot delete super admin account");
      }

      await Admin.findByIdAndDelete(adminId);
      return { message: "Admin deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify admin permissions
   */
  static async verifyPermission(adminId, module, action) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin || !admin.isActive) {
        throw new Error("Admin not found or inactive");
      }

      const hasPermission = admin.hasPermission(module, action);
      if (!hasPermission) {
        throw new Error(
          `Access denied. Required permission: ${action} on ${module}`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get admin dashboard stats
   */
  static async getDashboardStats(adminId) {
    try {
      // Import models here to avoid circular dependency
      const Product = require("../models/Product");
      const Dealer = require("../models/Dealer");
      const Blog = require("../models/Blog");
      const { Contact } = require("../models/TeamMember");

      const [
        totalProducts,
        activeProducts,
        totalDealers,
        verifiedDealers,
        publishedBlogs,
        draftBlogs,
        newContacts,
        pendingContacts,
      ] = await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ isActive: true }),
        Dealer.countDocuments({}),
        Dealer.countDocuments({ isVerified: true }),
        Blog.countDocuments({ status: "published" }),
        Blog.countDocuments({ status: "draft" }),
        Contact.countDocuments({ status: "new" }),
        Contact.countDocuments({ status: "in_progress" }),
      ]);

      return {
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        dealers: {
          total: totalDealers,
          verified: verifiedDealers,
        },
        blogs: {
          published: publishedBlogs,
          draft: draftBlogs,
        },
        contacts: {
          new: newContacts,
          pending: pendingContacts,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AdminService;
