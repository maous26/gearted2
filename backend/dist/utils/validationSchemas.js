"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchemas = void 0;
const joi_1 = __importDefault(require("joi"));
exports.authSchemas = {
    register: {
        body: joi_1.default.object({
            email: joi_1.default.string()
                .email()
                .required()
                .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
            username: joi_1.default.string()
                .alphanum()
                .min(3)
                .max(30)
                .optional()
                .messages({
                'string.alphanum': 'Username can only contain letters and numbers',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 30 characters'
            }),
            password: joi_1.default.string()
                .min(8)
                .required()
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'any.required': 'Password is required'
            }),
            firstName: joi_1.default.string()
                .min(1)
                .max(50)
                .optional()
                .messages({
                'string.min': 'First name cannot be empty',
                'string.max': 'First name cannot exceed 50 characters'
            }),
            lastName: joi_1.default.string()
                .min(1)
                .max(50)
                .optional()
                .messages({
                'string.min': 'Last name cannot be empty',
                'string.max': 'Last name cannot exceed 50 characters'
            }),
            location: joi_1.default.string()
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
        body: joi_1.default.object({
            email: joi_1.default.string()
                .email()
                .required()
                .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
            password: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Password is required'
            })
        })
    },
    refreshToken: {
        body: joi_1.default.object({
            refreshToken: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Refresh token is required'
            })
        })
    },
    forgotPassword: {
        body: joi_1.default.object({
            email: joi_1.default.string()
                .email()
                .required()
                .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            })
        })
    },
    resetPassword: {
        body: joi_1.default.object({
            token: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Reset token is required'
            }),
            password: joi_1.default.string()
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
        body: joi_1.default.object({
            token: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Verification token is required'
            })
        })
    },
    changePassword: {
        body: joi_1.default.object({
            currentPassword: joi_1.default.string()
                .required()
                .messages({
                'any.required': 'Current password is required'
            }),
            newPassword: joi_1.default.string()
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
//# sourceMappingURL=validationSchemas.js.map