interface CarrierAccount {
    object_id: string;
    carrier: string;
    account_id: string;
    active: boolean;
    test: boolean;
    parameters?: Record<string, any>;
}
interface ColissimoCredentials {
    accountId: string;
    password: string;
}
interface MondialRelayCredentials {
    merchantId: string;
    apiKey: string;
}
interface ChronopostCredentials {
    accountNumber: string;
    password?: string;
}
export declare class ShippoCarrierService {
    private static headers;
    static listCarrierAccounts(): Promise<CarrierAccount[]>;
    static getCarrierAccountsByName(carrierName: string): Promise<CarrierAccount[]>;
    static connectColissimo(credentials: ColissimoCredentials, isTest?: boolean): Promise<CarrierAccount>;
    static connectMondialRelay(credentials: MondialRelayCredentials, isTest?: boolean): Promise<CarrierAccount>;
    static connectChronopost(credentials: ChronopostCredentials, isTest?: boolean): Promise<CarrierAccount>;
    static updateCarrierAccount(carrierAccountId: string, updates: Partial<{
        active: boolean;
        parameters: Record<string, any>;
    }>): Promise<CarrierAccount>;
    static deleteCarrierAccount(carrierAccountId: string): Promise<void>;
    static setupAllCarriers(isTest?: boolean): Promise<{
        colissimo?: CarrierAccount | Error;
        mondialRelay?: CarrierAccount | Error;
        chronopost?: CarrierAccount | Error;
    }>;
    static getCarriersSummary(): Promise<{
        total: number;
        byCarrier: Record<string, {
            count: number;
            active: number;
            test: number;
        }>;
        accounts: CarrierAccount[];
    }>;
}
export {};
//# sourceMappingURL=ShippoCarrierService.d.ts.map