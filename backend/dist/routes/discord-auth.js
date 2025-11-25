"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DiscordAuthController_1 = require("../controllers/DiscordAuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/discord', DiscordAuthController_1.DiscordAuthController.getAuthUrl);
router.get('/discord/callback', DiscordAuthController_1.DiscordAuthController.callback);
router.post('/discord/logout', auth_1.authenticate, DiscordAuthController_1.DiscordAuthController.logout);
exports.default = router;
//# sourceMappingURL=discord-auth.js.map