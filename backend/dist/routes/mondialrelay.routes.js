"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MondialRelayController_1 = require("../controllers/MondialRelayController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/pickup-points', MondialRelayController_1.MondialRelayController.searchPickupPoints);
router.get('/rates', MondialRelayController_1.MondialRelayController.getShippingRates);
router.get('/tracking/:expeditionNumber', MondialRelayController_1.MondialRelayController.getTracking);
router.post('/label/:transactionId', auth_1.authenticate, MondialRelayController_1.MondialRelayController.createLabel);
exports.default = router;
//# sourceMappingURL=mondialrelay.routes.js.map