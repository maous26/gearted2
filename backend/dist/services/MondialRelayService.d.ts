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
export declare class MondialRelayService {
    private static calculateSecurityHash;
    private static createClient;
    static searchPickupPoints(postalCode: string, country?: string, weight?: number, radius?: number): Promise<PickupPoint[]>;
    static createShippingLabel(senderAddress: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        phone: string;
        email: string;
    }, recipientAddress: {
        name: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
        phone: string;
        email: string;
    }, pickupPointId: string, weight: number, orderReference: string): Promise<ShippingLabel>;
    static getShippingRates(weight: number, country?: string): Promise<{
        standard: number;
        express: number;
    }>;
}
export {};
//# sourceMappingURL=MondialRelayService.d.ts.map