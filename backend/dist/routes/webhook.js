"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const WebhookController_1 = require("../controllers/WebhookController");
const router = express_1.default.Router();
router.post('/', express_1.default.raw({ type: 'application/json' }), WebhookController_1.WebhookController.handleStripeWebhook);
exports.default = router;
//# sourceMappingURL=webhook.js.map