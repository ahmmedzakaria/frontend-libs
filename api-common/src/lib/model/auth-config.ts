export interface AuthConfig {
    authMode: 'LOCAL' | 'SSO';
    issuerUri?: string;
    clientId?: string;
    redirectUri?: string;
}
