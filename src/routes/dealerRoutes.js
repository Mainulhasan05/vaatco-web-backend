const express = require("express");
const DealerController = require("../controllers/dealerController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// PUBLIC ROUTES (no auth required)
router.get("/", DealerController.getAllDealers);
router.get("/public", DealerController.getDealersPublic);
router.get("/public/:id", DealerController.getDealerByIdPublic);
router.get("/:id", DealerController.getDealerById);

// ADMIN ROUTES (protected)
router.use(protect);

router.post("/", DealerController.createDealer);
router.put("/:id", DealerController.updateDealer);
router.delete("/:id", DealerController.deleteDealer);

module.exports = router;
