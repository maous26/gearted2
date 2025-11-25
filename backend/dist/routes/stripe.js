"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StripeController_1 = require("../controllers/StripeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/public-key', StripeController_1.StripeController.getPublicKey);
router.post('/connect/account', auth_1.authenticate, StripeController_1.StripeController.createConnectedAccount);
router.get('/connect/status', auth_1.authenticate, StripeController_1.StripeController.getAccountStatus);
router.post('/connect/onboarding-link', auth_1.authenticate, StripeController_1.StripeController.createOnboardingLink);
router.get('/connect/dashboard', auth_1.authenticate, StripeController_1.StripeController.getDashboardLink);
router.post('/create-payment-intent', auth_1.authenticate, StripeController_1.StripeController.createPaymentIntent);
router.post('/confirm-payment', auth_1.authenticate, StripeController_1.StripeController.confirmPayment);
router.post('/webhook', StripeController_1.StripeController.handleWebhook);
exports.default = router;
//# sourceMappingURL=stripe.js.map