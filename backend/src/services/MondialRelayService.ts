import soap from 'soap';
import crypto from 'crypto';

const MONDIAL_RELAY_WSDL = 'https://api.mondialrelay.com/Web_Services.asmx?WSDL';

// Credentials from environment variables (using official Mondial Relay test credentials)
const MR_ENSEIGNE = process.env.MONDIAL_RELAY_ENSEIGNE || 'BDTEST13';
const MR_PRIVATE_KEY = process.env.MONDIAL_RELAY_PRIVATE_KEY || 'TestAPI1key';
const MR_BRAND = process.env.MONDIAL_RELAY_BRAND || '11';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  distance: string;
  openingHours: Record<string, any>;
}

interface ShippingLabel {
  expeditionNumber: string;
  labelUrl: string;
  trackingUrl: string;
}

export class MondialRelayService {
  /**
   * Calculate security hash (MD5)
   * Concatenates all parameters in order + private key, then hashes with MD5
   */
  private static calculateSecurityHash(params: string[]): string {
    const concatenated = params.join('') + MR_PRIVATE_KEY;
    return crypto.createHash('md5').update(concatenated, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * Create SOAP client
   */
  private static async createClient() {
    try {
      return await soap.createClientAsync(MONDIAL_RELAY_WSDL);
    } catch (error: any) {
      console.error('[MondialRelay] SOAP client creation error:', error.message);
      throw new Error('Failed to connect to Mondial Relay API');
    }
  }

  /**
   * Search for nearby pickup points
   *
   * @param postalCode - Postal code to search around
   * @param country - Country code (FR, BE, etc.)
   * @param weight - Package weight in grams
   * @param radius - Search radius in meters (default 20000 = 20km)
   */
  static async searchPickupPoints(
    postalCode: string,
    country: string = 'FR',
    weight: number = 1000,
    radius: number = 20000
  ): Promise<PickupPoint[]> {
    try {
      console.log('[MondialRelay] Searching pickup points:', { postalCode, country, weight, radius });

      const client = await this.createClient();

      // Build security hash
      const securityParams = [
        MR_ENSEIGNE,
        country,
        '', // Ville (optional)
        postalCode,
        '', // Taille (optional)
        weight.toString(),
        '', // Action (optional)
        '', // DelaiEnvoi (optional)
        radius.toString(),
      ];

      const security = this.calculateSecurityHash(securityParams);

      // Call SOAP method
      const [result] = await client.WSI4_PointRelais_RechercheAsync({
        Enseigne: MR_ENSEIGNE,
        Pays: country,
        Ville: '',
        CP: postalCode,
        Latitude: '',
        Longitude: '',
        Taille: '',
        Poids: weight.toString(),
        Action: '',
        DelaiEnvoi: '',
        RayonRecherche: radius.toString(),
        TypeActivite: '',
        NACE: '',
        Security: security,
      });

      console.log('[MondialRelay] Search result:', JSON.stringify(result, null, 2));

      // Check for errors
      if (result.STAT !== '0') {
        console.error('[MondialRelay] Search error code:', result.STAT);
        throw new Error(`Mondial Relay search failed with code: ${result.STAT}`);
      }

      // Parse and return pickup points
      const points = result.PointsRelais?.PointRelais_Details || [];

      return Array.isArray(points) ? points.map((point: any) => ({
        id: point.Num,
        name: point.LgAdr1,
        address: `${point.LgAdr3} ${point.LgAdr4}`,
        city: point.Ville,
        postalCode: point.CP,
        country: point.Pays,
        latitude: point.Latitude,
        longitude: point.Longitude,
        distance: point.Distance,
        openingHours: {
          monday: point.Horaires_Lundi,
          tuesday: point.Horaires_Mardi,
          wednesday: point.Horaires_Mercredi,
          thursday: point.Horaires_Jeudi,
          friday: point.Horaires_Vendredi,
          saturday: point.Horaires_Samedi,
          sunday: point.Horaires_Dimanche,
        }
      })) : [];
    } catch (error: any) {
      console.error('[MondialRelay] Search pickup points error:', error);
      throw new Error(`Failed to search pickup points: ${error.message}`);
    }
  }

  /**
   * Create shipping label
   *
   * @param senderAddress - Sender (seller) address
   * @param recipientAddress - Recipient (buyer) address
   * @param pickupPointId - Mondial Relay pickup point ID
   * @param weight - Package weight in grams
   * @param orderReference - Your internal order reference
   */
  static async createShippingLabel(
    senderAddress: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
    },
    recipientAddress: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
    },
    pickupPointId: string,
    weight: number,
    orderReference: string
  ): Promise<ShippingLabel> {
    try {
      console.log('[MondialRelay] Creating shipping label:', {
        pickupPointId,
        weight,
        orderReference
      });

      const client = await this.createClient();

      // Mode de collecte et livraison
      const modeCol = '24R'; // Collecte en point relais
      const modeLiv = '24R'; // Livraison en point relais

      // Build security hash
      const securityParams = [
        MR_ENSEIGNE,
        modeCol,
        modeLiv,
        orderReference, // NDossier
        '', // NClient
        senderAddress.name.substring(0, 32), // Expe_Langage
        senderAddress.address.substring(0, 32), // Expe_Ad1
        '', // Expe_Ad2
        '', // Expe_Ad3
        '', // Expe_Ad4
        senderAddress.postalCode, // Expe_CP
        senderAddress.city.substring(0, 26), // Expe_Ville
        senderAddress.country, // Expe_Pays
        senderAddress.phone.substring(0, 15), // Expe_Tel1
        '', // Expe_Tel2
        senderAddress.email.substring(0, 70), // Expe_Mail
        recipientAddress.name.substring(0, 32), // Dest_Langage
        recipientAddress.address.substring(0, 32), // Dest_Ad1
        '', // Dest_Ad2
        '', // Dest_Ad3
        '', // Dest_Ad4
        recipientAddress.postalCode, // Dest_CP
        recipientAddress.city.substring(0, 26), // Dest_Ville
        recipientAddress.country, // Dest_Pays
        recipientAddress.phone.substring(0, 15), // Dest_Tel1
        '', // Dest_Tel2
        recipientAddress.email.substring(0, 70), // Dest_Mail
        weight.toString(), // Poids
        '', // Longueur
        '', // Taille
        '1', // NbColis
        '', // CRT_Valeur
        '', // CRT_Devise
        '', // Exp_Valeur
        '', // Exp_Devise
        recipientAddress.country, // COL_Rel_Pays
        pickupPointId, // COL_Rel
        recipientAddress.country, // LIV_Rel_Pays
        pickupPointId, // LIV_Rel
        '', // TAvisage
        '', // TReprise
        '', // Montage
        '', // TRDV
        '', // Assurance
        '', // Instructions
      ];

      const security = this.calculateSecurityHash(securityParams);

      // Call SOAP method to create label
      const [result] = await client.WSI2_CreationEtiquetteAsync({
        Enseigne: MR_ENSEIGNE,
        ModeCol: modeCol,
        ModeLiv: modeLiv,
        NDossier: orderReference,
        NClient: '',
        Expe_Langage: 'FR',
        Expe_Ad1: senderAddress.name.substring(0, 32),
        Expe_Ad2: '',
        Expe_Ad3: senderAddress.address.substring(0, 32),
        Expe_Ad4: '',
        Expe_CP: senderAddress.postalCode,
        Expe_Ville: senderAddress.city.substring(0, 26),
        Expe_Pays: senderAddress.country,
        Expe_Tel1: senderAddress.phone.substring(0, 15),
        Expe_Tel2: '',
        Expe_Mail: senderAddress.email.substring(0, 70),
        Dest_Langage: 'FR',
        Dest_Ad1: recipientAddress.name.substring(0, 32),
        Dest_Ad2: '',
        Dest_Ad3: recipientAddress.address.substring(0, 32),
        Dest_Ad4: '',
        Dest_CP: recipientAddress.postalCode,
        Dest_Ville: recipientAddress.city.substring(0, 26),
        Dest_Pays: recipientAddress.country,
        Dest_Tel1: recipientAddress.phone.substring(0, 15),
        Dest_Tel2: '',
        Dest_Mail: recipientAddress.email.substring(0, 70),
        Poids: weight.toString(),
        Longueur: '',
        Taille: '',
        NbColis: '1',
        CRT_Valeur: '',
        CRT_Devise: '',
        Exp_Valeur: '',
        Exp_Devise: '',
        COL_Rel_Pays: recipientAddress.country,
        COL_Rel: pickupPointId,
        LIV_Rel_Pays: recipientAddress.country,
        LIV_Rel: pickupPointId,
        TAvisage: '',
        TReprise: '',
        Montage: '0',
        TRDV: '',
        Assurance: '',
        Instructions: '',
        Security: security,
        Texte: '',
      });

      console.log('[MondialRelay] Label creation result:', JSON.stringify(result, null, 2));

      // Check for errors
      if (result.STAT !== '0') {
        console.error('[MondialRelay] Label creation error code:', result.STAT);
        throw new Error(`Mondial Relay label creation failed with code: ${result.STAT}`);
      }

      return {
        expeditionNumber: result.ExpeditionNum,
        labelUrl: result.URL_Etiquette,
        trackingUrl: `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${result.ExpeditionNum}`,
      };
    } catch (error: any) {
      console.error('[MondialRelay] Create shipping label error:', error);
      throw new Error(`Failed to create shipping label: ${error.message}`);
    }
  }

  /**
   * Get shipping rates for Mondial Relay
   * This is an estimation based on weight and distance
   */
  static async getShippingRates(weight: number, country: string = 'FR'): Promise<{
    standard: number;
    express: number;
  }> {
    // Mondial Relay pricing (approximations for France)
    // Prices vary by weight and destination
    let standardRate = 0;

    if (weight <= 500) {
      standardRate = 4.95;
    } else if (weight <= 1000) {
      standardRate = 5.95;
    } else if (weight <= 2000) {
      standardRate = 6.95;
    } else if (weight <= 5000) {
      standardRate = 8.95;
    } else if (weight <= 10000) {
      standardRate = 11.95;
    } else if (weight <= 20000) {
      standardRate = 16.95;
    } else {
      standardRate = 21.95;
    }

    return {
      standard: standardRate,
      express: standardRate * 1.5, // Express is roughly 50% more
    };
  }
}
