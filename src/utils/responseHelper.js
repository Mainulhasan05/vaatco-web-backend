/**
 * Common response helper for consistent API responses across the application
 */
class ResponseHelper {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = 200,
    meta = null
  ) {
    const response = {
      status: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {*} errors - Detailed error information
   */
  static error(
    res,
    message = "An error occurred",
    statusCode = 400,
    errors = null
  ) {
    const response = {
      status: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {*} errors - Validation errors
   * @param {string} message - Error message
   */
  static validationError(res, errors, message = "Validation failed") {
    return this.error(res, message, 422, errors);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name that was not found
   */
  static notFound(res, resource = "Resource") {
    return this.error(res, `${resource} not found`, 404);
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = "Unauthorized access") {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = "Access forbidden") {
    return this.error(res, message, 403);
  }

  /**
   * Send server error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static serverError(res, message = "Internal server error") {
    return this.error(res, message, 500);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   */
  static paginated(
    res,
    data,
    pagination,
    message = "Data retrieved successfully"
  ) {
    const meta = {
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.limit,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1,
      },
    };

    return this.success(res, data, message, 200, meta);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data, message = "Resource created successfully") {
    return this.success(res, data, message, 201);
  }

  /**
   * Send updated response
   * @param {Object} res - Express response object
   * @param {*} data - Updated resource data
   * @param {string} message - Success message
   */
  static updated(res, data, message = "Resource updated successfully") {
    return this.success(res, data, message, 200);
  }

  /**
   * Send deleted response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  static deleted(res, message = "Resource deleted successfully") {
    return this.success(res, null, message, 200);
  }
}

module.exports = ResponseHelper;
