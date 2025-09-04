const Admin = require("../models/Admin");
const bcryptjs = require("bcryptjs");

const seedDatabase = async () => {
  try {
    // check if super admin already exists
    const superAdminExists = await Admin.findOne({
      email: "mdrifatbd5@gmail.com",
    });
    if (superAdminExists) {
      console.log("Super admin already exists. Skipping seeding.");
      return;
    }
    const hashedPassword = await bcryptjs.hash("123456", 10);
    const superAdmin = new Admin({
      name: "Super Admin",
      email: "mdrifatbd5@gmail.com",
      password: hashedPassword,
      isActive: true,
    });
    await superAdmin.save();
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedDatabase;
