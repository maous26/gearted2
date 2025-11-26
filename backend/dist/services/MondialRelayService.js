"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MondialRelayService = void 0;
const soap_1 = __importDefault(require("soap"));
const crypto_1 = __importDefault(require("crypto"));
const MONDIAL_RELAY_WSDL = 'https://api.mondialrelay.com/Web_Services.asmx?WSDL';
const MR_ENSEIGNE = process.env.MONDIAL_RELAY_ENSEIGNE || 'BDTEST';
const MR_PRIVATE_KEY = process.env.MONDIAL_RELAY_PRIVATE_KEY || 'PrivateK';
const MR_BRAND = process.env.MONDIAL_RELAY_BRAND || 'NN';
class MondialRelayService {
    static calculateSecurityHash(params) {
        const concatenated = params.join('') + MR_PRIVATE_KEY;
        return crypto_1.default.createHash('md5').update(concatenated, 'utf8').digest('hex').toUpperCase();
    }
    static async createClient() {
        try {
            return await soap_1.default.createClientAsync(MONDIAL_RELAY_WSDL);
        }
        catch (error) {
            console.error('[MondialRelay] SOAP client creation error:', error.message);
            throw new Error('Failed to connect to Mondial Relay API');
        }
    }
    static async searchPickupPoints(postalCode, country = 'FR', weight = 1000, radius = 20000) {
        try {
            console.log('[MondialRelay] Searching pickup points:', { postalCode, country, weight, radius });
            const client = await this.createClient();
            const securityParams = [
                MR_ENSEIGNE,
                country,
                '',
                postalCode,
                '',
                weight.toString(),
                '',
                '',
                radius.toString(),
            ];
            const security = this.calculateSecurityHash(securityParams);
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
            if (result.STAT !== '0') {
                console.error('[MondialRelay] Search error code:', result.STAT);
                throw new Error(`Mondial Relay search failed with code: ${result.STAT}`);
            }
            const points = result.PointsRelais?.PointRelais_Details || [];
            return Array.isArray(points) ? points.map((point) => ({
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
        }
        catch (error) {
            console.error('[MondialRelay] Search pickup points error:', error);
            throw new Error(`Failed to search pickup points: ${error.message}`);
        }
    }
    static async createShippingLabel(senderAddress, recipientAddress, pickupPointId, weight, orderReference) {
        try {
            console.log('[MondialRelay] Creating shipping label:', {
                pickupPointId,
                weight,
                orderReference
            });
            const client = await this.createClient();
            const modeCol = '24R';
            const modeLiv = '24R';
            const securityParams = [
                MR_ENSEIGNE,
                modeCol,
                modeLiv,
                orderReference,
                '',
                senderAddress.name.substring(0, 32),
                senderAddress.address.substring(0, 32),
                '',
                '',
                '',
                senderAddress.postalCode,
                senderAddress.city.substring(0, 26),
                senderAddress.country,
                senderAddress.phone.substring(0, 15),
                '',
                senderAddress.email.substring(0, 70),
                recipientAddress.name.substring(0, 32),
                recipientAddress.address.substring(0, 32),
                '',
                '',
                '',
                recipientAddress.postalCode,
                recipientAddress.city.substring(0, 26),
                recipientAddress.country,
                recipientAddress.phone.substring(0, 15),
                '',
                recipientAddress.email.substring(0, 70),
                weight.toString(),
                '',
                '',
                '1',
                '',
                '',
                '',
                '',
                recipientAddress.country,
                pickupPointId,
                recipientAddress.country,
                pickupPointId,
                '',
                '',
                '',
                '',
                '',
                '',
            ];
            const security = this.calculateSecurityHash(securityParams);
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
            if (result.STAT !== '0') {
                console.error('[MondialRelay] Label creation error code:', result.STAT);
                throw new Error(`Mondial Relay label creation failed with code: ${result.STAT}`);
            }
            return {
                expeditionNumber: result.ExpeditionNum,
                labelUrl: result.URL_Etiquette,
                trackingUrl: `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${result.ExpeditionNum}`,
            };
        }
        catch (error) {
            console.error('[MondialRelay] Create shipping label error:', error);
            throw new Error(`Failed to create shipping label: ${error.message}`);
        }
    }
    static async getShippingRates(weight, country = 'FR') {
        let standardRate = 0;
        if (weight <= 500) {
            standardRate = 4.95;
        }
        else if (weight <= 1000) {
            standardRate = 5.95;
        }
        else if (weight <= 2000) {
            standardRate = 6.95;
        }
        else if (weight <= 5000) {
            standardRate = 8.95;
        }
        else if (weight <= 10000) {
            standardRate = 11.95;
        }
        else if (weight <= 20000) {
            standardRate = 16.95;
        }
        else {
            standardRate = 21.95;
        }
        return {
            standard: standardRate,
            express: standardRate * 1.5,
        };
    }
}
exports.MondialRelayService = MondialRelayService;
//# sourceMappingURL=MondialRelayService.js.map