const Joi = require("joi");
const ResponseHelper = require("../utils/responseHelper");

/**
 * Validation middleware wrapper
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.path[0]] = detail.message;
      });

      return ResponseHelper.validationError(res, errors);
    }

    next();
  };
};

/**
 * Admin login validation schema
 */
const adminLoginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

/**
 * Admin creation validation schema
 */
const adminCreateSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "Password is required",
    }),

  role: Joi.string().valid("admin", "editor").default("admin").messages({
    "any.only": "Role must be either admin or editor",
  }),

  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),

  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string()
          .valid(
            "products",
            "dealers",
            "gallery",
            "blogs",
            "team",
            "services",
            "contacts",
            "admins"
          )
          .required(),
        actions: Joi.array()
          .items(Joi.string().valid("create", "read", "update", "delete"))
          .min(1)
          .required(),
      })
    )
    .optional(),
});

/**
 * Profile update validation schema
 */
const adminProfileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
  }),

  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),

  profileImage: Joi.object({
    url: Joi.string().uri().required(),
    public_id: Joi.string().required(),
  }).optional(),
});

/**
 * Password change validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),

  newPassword: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "New password is required",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),
});

// Export validation middleware
module.exports = {
  validateAdminLogin: validate(adminLoginSchema),
  validateAdminCreate: validate(adminCreateSchema),
  validateAdminProfileUpdate: validate(adminProfileUpdateSchema),
  validateChangePassword: validate(changePasswordSchema),
};
