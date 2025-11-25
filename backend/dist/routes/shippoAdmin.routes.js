"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ShippoAdminController_1 = require("../controllers/ShippoAdminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/carriers', ShippoAdminController_1.ShippoAdminController.listCarriers);
router.get('/carriers/summary', ShippoAdminController_1.ShippoAdminController.getCarriersSummary);
router.get('/carriers/by-name/:carrierName', ShippoAdminController_1.ShippoAdminController.getCarriersByName);
router.post('/carriers/colissimo', ShippoAdminController_1.ShippoAdminController.connectColissimo);
router.post('/carriers/mondialrelay', ShippoAdminController_1.ShippoAdminController.connectMondialRelay);
router.post('/carriers/chronopost', ShippoAdminController_1.ShippoAdminController.connectChronopost);
router.post('/carriers/setup-all', ShippoAdminController_1.ShippoAdminController.setupAllCarriers);
router.put('/carriers/:carrierId', ShippoAdminController_1.ShippoAdminController.updateCarrier);
router.delete('/carriers/:carrierId', ShippoAdminController_1.ShippoAdminController.deleteCarrier);
exports.default = router;
//# sourceMappingURL=shippoAdmin.routes.js.map