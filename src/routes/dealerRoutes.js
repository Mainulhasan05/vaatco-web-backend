const express = require("express");
const DealerController = require("../controllers/dealerController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES
router.get("/public", DealerController.getDealersPublic);
router.get("/public/:id", DealerController.getDealerByIdPublic);

// ADMIN ROUTES (protected)
router.use(protect);

// CRUD operations
router.get("/", DealerController.getAllDealers);
router.get("/:id", DealerController.getDealerById);
router.post("/", DealerController.createDealer);
router.put("/:id", DealerController.updateDealer);
router.delete("/:id", DealerController.deleteDealer);

module.exports = router;
