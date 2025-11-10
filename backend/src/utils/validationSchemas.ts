import Joi from 'joi';

export const authSchemas = {
  register: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .optional()
        .messages({
          'string.alphanum': 'Username can only contain letters and numbers',
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username cannot exceed 30 characters'
        }),
      
      password: Joi.string()
        .min(8)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required'
        }),
      
      firstName: Joi.string()
        .min(1)
        .max(50)
        .optional()
        .messages({
          'string.min': 'First name cannot be empty',
          'string.max': 'First name cannot exceed 50 characters'
        }),
      
      lastName: Joi.string()
        .min(1)
        .max(50)
        .optional()
        .messages({
          'string.min': 'Last name cannot be empty',
          'string.max': 'Last name cannot exceed 50 characters'
        }),
      
      location: Joi.string()
        .min(1)
        .max(200)
        .optional()
        .messages({
          'string.min': 'Location cannot be empty',
          'string.max': 'Location cannot exceed 200 characters'
        })
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required'
        })
    })
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string()
        .required()
        .messages({
          'any.required': 'Refresh token is required'
        })
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        })
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string()
        .required()
        .messages({
          'any.required': 'Reset token is required'
        }),
      
      password: Joi.string()
        .min(8)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'Password is required'
        })
    })
  },

  verifyEmail: {
    body: Joi.object({
      token: Joi.string()
        .required()
        .messages({
          'any.required': 'Verification token is required'
        })
    })
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string()
        .required()
        .messages({
          'any.required': 'Current password is required'
        }),
      
      newPassword: Joi.string()
        .min(8)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'New password must be at least 8 characters long',
          'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'any.required': 'New password is required'
        })
    })
  }
};