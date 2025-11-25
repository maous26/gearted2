"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const TransactionController_1 = require("../controllers/TransactionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/my-sales', TransactionController_1.TransactionController.getMySales);
router.get('/my-purchases', TransactionController_1.TransactionController.getMyPurchases);
router.get('/:transactionId', TransactionController_1.TransactionController.getTransactionDetails);
exports.default = router;
//# sourceMappingURL=transactions.js.map