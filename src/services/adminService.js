const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const transporter = require("../config/email");
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

  static async forgotPassword(email) {
    try {
      const admin = await Admin.findOne({ email, isActive: true });

      if (!admin) {
        throw new Error("Admin not found with that email");
      }

      const resetToken = admin.getResetPasswordToken();
      await admin.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;

      const message = `
      <h1>Password Reset Request</h1>
      <p>You have requested a password reset for your admin account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

      try {
        await transporter.sendMail({
          from: "info@vaatcobd.com",
          to: admin.email,
          subject: "Password Reset Request",
          html: message,
        });

        return { message: "Email sent successfully" };
      } catch (error) {
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpire = undefined;
        await admin.save({ validateBeforeSave: false });
        throw new Error("Email could not be sent");
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(resetToken, password) {
    try {
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const admin = await Admin.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!admin) {
        throw new Error("Invalid or expired token");
      }

      admin.password = password;
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;

      await admin.save();

      return { message: "Password reset successful" };
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
