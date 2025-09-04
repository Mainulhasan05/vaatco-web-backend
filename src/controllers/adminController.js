const AdminService = require("../services/adminService");
const ResponseHelper = require("../utils/responseHelper");

class AdminController {
  /**
   * Login admin
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ResponseHelper.validationError(res, {
          email: email ? null : "Email is required",
          password: password ? null : "Password is required",
        });
      }

      const result = await AdminService.loginAdmin(email, password);

      return ResponseHelper.success(res, result, "Login successful", 200);
    } catch (error) {
      return ResponseHelper.error(res, error.message, 401);
    }
  }

  /**
   * Get current admin profile
   */
  static async getProfile(req, res) {
    try {
      const admin = await AdminService.getAdminProfile(req.admin._id);

      return ResponseHelper.success(
        res,
        admin,
        "Profile retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Update admin profile
   */
  static async updateProfile(req, res) {
    try {
      const admin = await AdminService.updateAdminProfile(
        req.admin._id,
        req.body
      );

      return ResponseHelper.updated(res, admin, "Profile updated successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return ResponseHelper.validationError(res, {
          currentPassword: currentPassword
            ? null
            : "Current password is required",
          newPassword: newPassword ? null : "New password is required",
          confirmPassword: confirmPassword
            ? null
            : "Confirm password is required",
        });
      }

      if (newPassword !== confirmPassword) {
        return ResponseHelper.validationError(res, {
          confirmPassword: "Passwords do not match",
        });
      }

      if (newPassword.length < 6) {
        return ResponseHelper.validationError(res, {
          newPassword: "Password must be at least 6 characters long",
        });
      }

      const result = await AdminService.changePassword(
        req.admin._id,
        currentPassword,
        newPassword
      );

      return ResponseHelper.success(res, null, result.message);
    } catch (error) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  /**
   * Create new admin (Super admin only)
   */
  static async createAdmin(req, res) {
    try {
      const admin = await AdminService.createAdmin(req.admin._id, req.body);

      return ResponseHelper.created(res, admin, "Admin created successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  /**
   * Get all admins (Super admin only)
   */
  static async getAllAdmins(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getAllAdmins(
        req.admin._id,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );

      return ResponseHelper.paginated(
        res,
        result.admins,
        result.pagination,
        "Admins retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message, 403);
    }
  }

  /**
   * Update admin status (Super admin only)
   */
  static async updateAdminStatus(req, res) {
    try {
      const { adminId } = req.params;
      const { isActive } = req.body;

      const admin = await AdminService.updateAdminStatus(
        req.admin._id,
        adminId,
        isActive
      );

      return ResponseHelper.updated(
        res,
        admin,
        "Admin status updated successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message, 403);
    }
  }

  /**
   * Update admin permissions (Super admin only)
   */
  static async updateAdminPermissions(req, res) {
    try {
      const { adminId } = req.params;
      const { permissions } = req.body;

      const admin = await AdminService.updateAdminPermissions(
        req.admin._id,
        adminId,
        permissions
      );

      return ResponseHelper.updated(
        res,
        admin,
        "Admin permissions updated successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message, 403);
    }
  }

  /**
   * Delete admin (Super admin only)
   */
  static async deleteAdmin(req, res) {
    try {
      const { adminId } = req.params;

      const result = await AdminService.deleteAdmin(req.admin._id, adminId);

      return ResponseHelper.deleted(res, result.message);
    } catch (error) {
      return ResponseHelper.error(res, error.message, 403);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const stats = await AdminService.getDashboardStats(req.admin._id);

      return ResponseHelper.success(
        res,
        stats,
        "Dashboard stats retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  /**
   * Logout (Token invalidation would be handled by frontend)
   */
  static async logout(req, res) {
    try {
      return ResponseHelper.success(res, null, "Logged out successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }
}

module.exports = AdminController;
