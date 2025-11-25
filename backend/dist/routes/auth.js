"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_1.validateRequest)(validationSchemas_1.authSchemas.register), AuthController_1.AuthController.register);
router.post('/login', (0, validation_1.validateRequest)(validationSchemas_1.authSchemas.login), AuthController_1.AuthController.login);
router.post('/refresh-token', (0, validation_1.validateRequest)(validationSchemas_1.authSchemas.refreshToken), AuthController_1.AuthController.refreshToken);
router.post('/logout', auth_1.authenticate, AuthController_1.AuthController.logout);
router.get('/profile', auth_1.authenticate, AuthController_1.AuthController.getProfile);
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map