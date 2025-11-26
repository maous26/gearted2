"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippoAdminController = void 0;
const ShippoCarrierService_1 = require("../services/ShippoCarrierService");
class ShippoAdminController {
    static async listCarriers(req, res) {
        try {
            const accounts = await ShippoCarrierService_1.ShippoCarrierService.listCarrierAccounts();
            return res.json({
                success: true,
                count: accounts.length,
                carriers: accounts
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] List carriers error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getCarriersSummary(req, res) {
        try {
            const summary = await ShippoCarrierService_1.ShippoCarrierService.getCarriersSummary();
            return res.json({
                success: true,
                summary
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Get summary error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async connectColissimo(req, res) {
        try {
            const { accountId, password, isTest = true } = req.body;
            if (!accountId || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'accountId and password are required'
                });
            }
            const account = await ShippoCarrierService_1.ShippoCarrierService.connectColissimo({ accountId, password }, isTest);
            return res.json({
                success: true,
                message: 'Colissimo account connected successfully',
                account
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Connect Colissimo error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async connectMondialRelay(req, res) {
        try {
            return res.status(501).json({
                success: false,
                error: 'Mondial Relay is now integrated directly, not via Shippo. Use /api/mondialrelay endpoints instead.'
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Connect Mondial Relay error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async connectChronopost(req, res) {
        try {
            const { accountNumber, password, isTest = true } = req.body;
            if (!accountNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'accountNumber is required'
                });
            }
            const account = await ShippoCarrierService_1.ShippoCarrierService.connectChronopost({ accountNumber, password }, isTest);
            return res.json({
                success: true,
                message: 'Chronopost account connected successfully',
                account
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Connect Chronopost error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async setupAllCarriers(req, res) {
        try {
            const { isTest = true } = req.body;
            console.log('[ShippoAdmin] Setting up all carriers from .env...', { isTest });
            const results = await ShippoCarrierService_1.ShippoCarrierService.setupAllCarriers(isTest);
            const summary = {
                colissimo: results.colissimo instanceof Error
                    ? { success: false, error: results.colissimo.message }
                    : results.colissimo
                        ? { success: true, accountId: results.colissimo.object_id }
                        : { success: false, error: 'Credentials not found in .env' },
                mondialRelay: results.mondialRelay instanceof Error
                    ? { success: false, error: results.mondialRelay.message }
                    : results.mondialRelay
                        ? { success: true, accountId: results.mondialRelay.object_id }
                        : { success: false, error: 'Credentials not found in .env' },
                chronopost: results.chronopost instanceof Error
                    ? { success: false, error: results.chronopost.message }
                    : results.chronopost
                        ? { success: true, accountId: results.chronopost.object_id }
                        : { success: false, error: 'Credentials not found in .env' }
            };
            return res.json({
                success: true,
                message: 'Carrier setup completed',
                results: summary
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Setup all carriers error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async updateCarrier(req, res) {
        try {
            const { carrierId } = req.params;
            const updates = req.body;
            if (!carrierId) {
                return res.status(400).json({
                    success: false,
                    error: 'carrierId is required'
                });
            }
            const account = await ShippoCarrierService_1.ShippoCarrierService.updateCarrierAccount(carrierId, updates);
            return res.json({
                success: true,
                message: 'Carrier account updated successfully',
                account
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Update carrier error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async deleteCarrier(req, res) {
        try {
            const { carrierId } = req.params;
            if (!carrierId) {
                return res.status(400).json({
                    success: false,
                    error: 'carrierId is required'
                });
            }
            await ShippoCarrierService_1.ShippoCarrierService.deleteCarrierAccount(carrierId);
            return res.json({
                success: true,
                message: 'Carrier account deleted successfully'
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Delete carrier error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getCarriersByName(req, res) {
        try {
            const { carrierName } = req.params;
            if (!carrierName) {
                return res.status(400).json({
                    success: false,
                    error: 'carrierName is required'
                });
            }
            const accounts = await ShippoCarrierService_1.ShippoCarrierService.getCarrierAccountsByName(carrierName);
            return res.json({
                success: true,
                carrier: carrierName,
                count: accounts.length,
                accounts
            });
        }
        catch (error) {
            console.error('[ShippoAdmin] Get carriers by name error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.ShippoAdminController = ShippoAdminController;
//# sourceMappingURL=ShippoAdminController.js.map