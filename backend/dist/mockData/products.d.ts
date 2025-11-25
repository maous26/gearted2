export interface MockProduct {
    id: string;
    title: string;
    price: number;
    condition: string;
    location: string;
    seller: string;
    sellerId?: string;
    rating: number;
    images: string[];
    category: string;
    featured: boolean;
    createdAt: string;
    description?: string;
    listingType?: 'SALE' | 'TRADE' | 'BOTH';
    tradeFor?: string;
    handDelivery?: boolean;
}
export declare function getAllMockProducts(): MockProduct[];
export declare function findMockProductById(id: string): MockProduct | undefined;
export declare function addMockProduct(product: Omit<MockProduct, 'id' | 'createdAt'> & Partial<Pick<MockProduct, 'id' | 'createdAt'>>): MockProduct;
export declare function resetMockProducts(products: MockProduct[]): void;
//# sourceMappingURL=products.d.ts.map