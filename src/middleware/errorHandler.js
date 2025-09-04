const ResponseHelper = require("../utils/responseHelper");

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.error("Error Details:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Invalid ID format";
    return ResponseHelper.error(res, message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } '${value}' already exists`;
    return ResponseHelper.error(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = {};
    Object.values(err.errors).forEach((val) => {
      errors[val.path] = val.message;
    });
    return ResponseHelper.validationError(res, errors);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid access token";
    return ResponseHelper.unauthorized(res, message);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Access token has expired";
    return ResponseHelper.unauthorized(res, message);
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File size too large";
    return ResponseHelper.error(res, message, 400);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Too many files uploaded";
    return ResponseHelper.error(res, message, 400);
  }

  // Cloudinary errors
  if (err.http_code) {
    const message = err.message || "File upload error";
    return ResponseHelper.error(res, message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    return ResponseHelper.error(res, message, 429);
  }

  // Default server error
  const message = error.message || "Internal server error";
  const statusCode = error.statusCode || 500;

  // Don't expose internal errors in production
  const responseMessage =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Something went wrong. Please try again later."
      : message;

  return ResponseHelper.error(res, responseMessage, statusCode);
};

/**
 * Handle async errors without try-catch
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
};
