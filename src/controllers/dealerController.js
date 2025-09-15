const DealerService = require("../services/dealerService");
const ResponseHelper = require("../utils/responseHelper");

class DealerController {
  // PUBLIC API - Get dealers with search, pagination, filter
  static async getDealersPublic(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 12,
        search: req.query.keyword,
        location: req.query.location,
        isVerified:
          req.query.verified === "true"
            ? true
            : req.query.verified === "false"
            ? false
            : undefined,
        isFeatured:
          req.query.featured === "true"
            ? true
            : req.query.featured === "false"
            ? false
            : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await DealerService.getDealersPublic(filters);

      return ResponseHelper.paginated(
        res,
        result.dealers,
        result.pagination,
        "Dealers retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // PUBLIC API - Get single dealer by ID
  static async getDealerByIdPublic(req, res) {
    try {
      const { id } = req.params;
      const dealer = await DealerService.getDealerByIdPublic(id);

      return ResponseHelper.success(
        res,
        dealer,
        "Dealer retrieved successfully"
      );
    } catch (error) {
      if (error.message === "Dealer not found") {
        return ResponseHelper.notFound(res, "Dealer");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get all dealers
  static async getAllDealers(req, res) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        location: req.query.location,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
            ? false
            : undefined,
        isVerified:
          req.query.isVerified === "true"
            ? true
            : req.query.isVerified === "false"
            ? false
            : undefined,
        isFeatured:
          req.query.isFeatured === "true"
            ? true
            : req.query.isFeatured === "false"
            ? false
            : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await DealerService.getAllDealers(filters);

      return ResponseHelper.paginated(
        res,
        result.dealers,
        result.pagination,
        "Dealers retrieved successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Get single dealer by ID
  static async getDealerById(req, res) {
    try {
      const { id } = req.params;
      const dealer = await DealerService.getDealerById(id);

      return ResponseHelper.success(
        res,
        dealer,
        "Dealer retrieved successfully"
      );
    } catch (error) {
      if (error.message === "Dealer not found") {
        return ResponseHelper.notFound(res, "Dealer");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Create dealer
  static async createDealer(req, res) {
    try {
      const dealer = await DealerService.createDealer(req.body, req.admin._id);

      return ResponseHelper.created(res, dealer, "Dealer created successfully");
    } catch (error) {
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Update dealer
  static async updateDealer(req, res) {
    try {
      const { id } = req.params;
      const dealer = await DealerService.updateDealer(
        id,
        req.body,
        req.admin._id
      );

      return ResponseHelper.updated(res, dealer, "Dealer updated successfully");
    } catch (error) {
      if (error.message === "Dealer not found") {
        return ResponseHelper.notFound(res, "Dealer");
      }
      return ResponseHelper.error(res, error.message);
    }
  }

  // ADMIN - Delete dealer
  static async deleteDealer(req, res) {
    try {
      const { id } = req.params;
      const result = await DealerService.deleteDealer(id);

      return ResponseHelper.deleted(res, result.message);
    } catch (error) {
      if (error.message === "Dealer not found") {
        return ResponseHelper.notFound(res, "Dealer");
      }
      return ResponseHelper.error(res, error.message);
    }
  }
}

module.exports = DealerController;
