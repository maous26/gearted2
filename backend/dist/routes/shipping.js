"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ShippingController_1 = require("../controllers/ShippingController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/address/:transactionId', ShippingController_1.ShippingController.addShippingAddress);
router.post('/dimensions/:transactionId', ShippingController_1.ShippingController.setParcelDimensions);
router.post('/rates/:transactionId', ShippingController_1.ShippingController.getShippingRates);
router.post('/label/:transactionId', ShippingController_1.ShippingController.purchaseLabel);
router.get('/tracking/:transactionId', ShippingController_1.ShippingController.getTracking);
router.get('/pending', ShippingController_1.ShippingController.getPendingShipments);
router.delete('/address/:transactionId', ShippingController_1.ShippingController.deleteShippingAddress);
router.get('/my-addresses', ShippingController_1.ShippingController.getMyShippingAddresses);
exports.default = router;
//# sourceMappingURL=shipping.js.map