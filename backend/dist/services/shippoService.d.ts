interface ShippoAddress {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
}
interface ShippoParcel {
    length: string;
    width: string;
    height: string;
    distance_unit: 'cm' | 'in';
    weight: string;
    mass_unit: 'kg' | 'lb';
}
interface ShippoRate {
    object_id: string;
    provider: string;
    servicelevel: {
        name: string;
        token: string;
    };
    amount: string;
    currency: string;
    estimated_days: number;
}
interface ShippoShipment {
    object_id: string;
    rates: ShippoRate[];
}
interface ShippoTransaction {
    object_id: string;
    status: string;
    label_url: string;
    tracking_number: string;
    tracking_url_provider: string;
    eta: string;
}
export declare class ShippoService {
    private static headers;
    static createAddress(address: ShippoAddress): Promise<any>;
    static createParcel(parcel: ShippoParcel): Promise<any>;
    static createShipment(fromAddress: ShippoAddress, toAddress: ShippoAddress, parcel: ShippoParcel): Promise<ShippoShipment>;
    static purchaseLabel(rateId: string): Promise<ShippoTransaction>;
    static getTracking(carrier: string, trackingNumber: string): Promise<any>;
    static getShippingRates(fromAddress: ShippoAddress, toAddress: ShippoAddress, parcel: ShippoParcel): Promise<{
        shipmentId: string;
        rates: {
            rateId: string;
            provider: string;
            serviceName: string;
            price: number;
            currency: string;
            estimatedDays: number;
        }[];
    }>;
    static buyShippingLabel(rateId: string): Promise<{
        labelUrl: string;
        trackingNumber: string;
        trackingUrl: string;
        estimatedDelivery: string;
    }>;
}
export {};
//# sourceMappingURL=ShippoService.d.ts.map