const router = require("express").Router();
// Import Routes
const adminRoutes = require("./adminRoutes");
// const productRoutes = require("./productRoutes");
// const dealerRoutes = require("./dealerRoutes");
const galleryRoutes = require("./galleryRoutes");
// const blogRoutes = require("./blogRoutes");
// const teamRoutes = require("./teamRoutes");
// const serviceRoutes = require("./serviceRoutes");
// const contactRoutes = require("./contactRoutes");
const publicRoutes = require("./publicRoutes");

// Routes
router.use("/admin", adminRoutes);
// router.use("/products", productRoutes);
// router.use("/dealers", dealerRoutes);
router.use("/gallery", galleryRoutes);
router.use("/public", publicRoutes);

// router.use("/blogs", blogRoutes);
// router.use("/team", teamRoutes);
// router.use("/services", serviceRoutes);
// router.use("/contact", contactRoutes);
module.exports = router;
