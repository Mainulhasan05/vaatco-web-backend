const express = require("express");
const AdminController = require("../controllers/adminController");
const { protect, superAdminOnly } = require("../middleware/auth");
// const {
//   validateAdminLogin,
//   validateAdminCreate,
// } = require("../validators/adminValidator");

const router = express.Router();

// Public routes
router.post("/login", AdminController.login);
router.post("/forgot-password", AdminController.forgotPassword);
router.put("/reset-password/:token", AdminController.resetPassword);

// Protected routes (require authentication)
router.use(protect);

// Profile routes
router.get("/profile", AdminController.getProfile);
// router.put("/profile", AdminController.updateProfile);
router.put("/change-password", AdminController.changePassword);
router.post("/logout", AdminController.logout);

// Dashboard
router.get("/dashboard/stats", AdminController.getDashboardStats);

// Super admin only routes
// router.use(superAdminOnly);

// Admin management
router.get("/admins", AdminController.getAllAdmins);
router.post("/create", AdminController.createAdmin);
// router.put("/admins/:adminId/status", AdminController.updateAdminStatus);
// router.put(
//   "/admins/:adminId/permissions",
//   AdminController.updateAdminPermissions
// );
// router.delete("/admins/:adminId", AdminController.deleteAdmin);

module.exports = router;
