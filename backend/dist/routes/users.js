"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/me', auth_1.authenticate, UserController_1.UserController.getProfile);
router.patch('/me', auth_1.authenticate, UserController_1.UserController.updateProfile);
exports.default = router;
//# sourceMappingURL=users.js.map