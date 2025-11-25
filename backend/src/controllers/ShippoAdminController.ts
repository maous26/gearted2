import { Request, Response } from 'express';
import { ShippoCarrierService } from '../services/ShippoCarrierService';

export class ShippoAdminController {
  /**
   * Get all carrier accounts configured in Shippo
   * GET /api/admin/shippo/carriers
   */
  static async listCarriers(req: Request, res: Response) {
    try {
      const accounts = await ShippoCarrierService.listCarrierAccounts();

      return res.json({
        success: true,
        count: accounts.length,
        carriers: accounts
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] List carriers error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get summary of all carriers with statistics
   * GET /api/admin/shippo/carriers/summary
   */
  static async getCarriersSummary(req: Request, res: Response) {
    try {
      const summary = await ShippoCarrierService.getCarriersSummary();

      return res.json({
        success: true,
        summary
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Get summary error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Connect Colissimo carrier account
   * POST /api/admin/shippo/carriers/colissimo
   * Body: { accountId: string, password: string, isTest?: boolean }
   */
  static async connectColissimo(req: Request, res: Response) {
    try {
      const { accountId, password, isTest = true } = req.body;

      if (!accountId || !password) {
        return res.status(400).json({
          success: false,
          error: 'accountId and password are required'
        });
      }

      const account = await ShippoCarrierService.connectColissimo(
        { accountId, password },
        isTest
      );

      return res.json({
        success: true,
        message: 'Colissimo account connected successfully',
        account
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Connect Colissimo error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Connect Mondial Relay carrier account
   * POST /api/admin/shippo/carriers/mondialrelay
   * Body: { merchantId: string, apiKey: string, isTest?: boolean }
   */
  static async connectMondialRelay(req: Request, res: Response) {
    try {
      const { merchantId, apiKey, isTest = true } = req.body;

      if (!merchantId || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'merchantId and apiKey are required'
        });
      }

      const account = await ShippoCarrierService.connectMondialRelay(
        { merchantId, apiKey },
        isTest
      );

      return res.json({
        success: true,
        message: 'Mondial Relay account connected successfully',
        account
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Connect Mondial Relay error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Connect Chronopost carrier account
   * POST /api/admin/shippo/carriers/chronopost
   * Body: { accountNumber: string, password?: string, isTest?: boolean }
   */
  static async connectChronopost(req: Request, res: Response) {
    try {
      const { accountNumber, password, isTest = true } = req.body;

      if (!accountNumber) {
        return res.status(400).json({
          success: false,
          error: 'accountNumber is required'
        });
      }

      const account = await ShippoCarrierService.connectChronopost(
        { accountNumber, password },
        isTest
      );

      return res.json({
        success: true,
        message: 'Chronopost account connected successfully',
        account
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Connect Chronopost error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Setup all carriers from environment variables
   * POST /api/admin/shippo/carriers/setup-all
   * Body: { isTest?: boolean }
   */
  static async setupAllCarriers(req: Request, res: Response) {
    try {
      const { isTest = true } = req.body;

      console.log('[ShippoAdmin] Setting up all carriers from .env...', { isTest });

      const results = await ShippoCarrierService.setupAllCarriers(isTest);

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
    } catch (error: any) {
      console.error('[ShippoAdmin] Setup all carriers error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update carrier account (activate/deactivate, update credentials)
   * PUT /api/admin/shippo/carriers/:carrierId
   * Body: { active?: boolean, parameters?: object }
   */
  static async updateCarrier(req: Request, res: Response) {
    try {
      const { carrierId } = req.params;
      const updates = req.body;

      if (!carrierId) {
        return res.status(400).json({
          success: false,
          error: 'carrierId is required'
        });
      }

      const account = await ShippoCarrierService.updateCarrierAccount(
        carrierId,
        updates
      );

      return res.json({
        success: true,
        message: 'Carrier account updated successfully',
        account
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Update carrier error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete carrier account
   * DELETE /api/admin/shippo/carriers/:carrierId
   */
  static async deleteCarrier(req: Request, res: Response) {
    try {
      const { carrierId } = req.params;

      if (!carrierId) {
        return res.status(400).json({
          success: false,
          error: 'carrierId is required'
        });
      }

      await ShippoCarrierService.deleteCarrierAccount(carrierId);

      return res.json({
        success: true,
        message: 'Carrier account deleted successfully'
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Delete carrier error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get carriers by name
   * GET /api/admin/shippo/carriers/by-name/:carrierName
   */
  static async getCarriersByName(req: Request, res: Response) {
    try {
      const { carrierName } = req.params;

      if (!carrierName) {
        return res.status(400).json({
          success: false,
          error: 'carrierName is required'
        });
      }

      const accounts = await ShippoCarrierService.getCarrierAccountsByName(carrierName);

      return res.json({
        success: true,
        carrier: carrierName,
        count: accounts.length,
        accounts
      });
    } catch (error: any) {
      console.error('[ShippoAdmin] Get carriers by name error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
