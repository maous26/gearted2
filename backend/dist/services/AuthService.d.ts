interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private static readonly ACCESS_TOKEN_EXPIRY;
    private static readonly REFRESH_TOKEN_EXPIRY;
    private static readonly SALT_ROUNDS;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    static generateTokens(payload: TokenPayload): TokenPair;
    static verifyAccessToken(token: string): TokenPayload | null;
    static verifyRefreshToken(token: string): {
        userId: string;
    } | null;
    static generateSecureToken(): string;
    static generateVerificationCode(): string;
    static createPasswordResetToken(): {
        token: string;
        expires: Date;
    };
    static createEmailVerificationToken(): {
        token: string;
        expires: Date;
    };
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static validateEmail(email: string): boolean;
    static generateUsername(email: string, existingUsernames?: string[]): string;
    static sanitizeUser(user: any): any;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map