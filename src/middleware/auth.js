const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const AdminService = require("../services/adminService");
const ResponseHelper = require("../utils/responseHelper");

/**
 * Protect routes - Require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ResponseHelper.unauthorized(res, "Access token is required");
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from token
      const admin = await Admin.findById(decoded.adminId);

      if (!admin) {
        return ResponseHelper.unauthorized(res, "Invalid access token");
      }

      if (!admin.isActive) {
        return ResponseHelper.unauthorized(res, "Account has been deactivated");
      }

      // Add admin to request object
      req.admin = admin;
      next();
    } catch (error) {
      return ResponseHelper.unauthorized(res, "Invalid access token");
    }
  } catch (error) {
    return ResponseHelper.serverError(res, "Authentication error");
  }
};

/**
 * Check specific permission
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      await AdminService.verifyPermission(req.admin._id, module, action);
      next();
    } catch (error) {
      return ResponseHelper.forbidden(res, error.message);
    }
  };
};

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return ResponseHelper.forbidden(
        res,
        `Access denied. Required role: ${roles.join(" or ")}`
      );
    }
    next();
  };
};

/**
 * Super admin only
 */
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== "super_admin") {
    return ResponseHelper.forbidden(
      res,
      "Access denied. Super admin role required."
    );
  }
  next();
};

/**
 * Optional authentication - for routes that work with or without auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);

        if (admin && admin.isActive) {
          req.admin = admin;
        }
      } catch (error) {
        // Token invalid, but continue without auth
        req.admin = null;
      }
    }

    next();
  } catch (error) {
    return ResponseHelper.serverError(res, "Authentication error");
  }
};

module.exports = {
  protect,
  checkPermission,
  restrictTo,
  superAdminOnly,
  optionalAuth,
};
