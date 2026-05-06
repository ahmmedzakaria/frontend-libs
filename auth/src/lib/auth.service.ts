import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, switchMap, of, throwError, from, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {ActionTypes, ApiEndpoint, ApiService, AuthConfig, AuthResponse} from "@nexacore/api-common";
import {jwtDecode} from "jwt-decode";
import {LayoutService, SidebarMenuService} from "@nexacore/layout";
import {Router} from "@angular/router";



interface DecodedToken {
    roles: string[];
    sub: string;
    exp: number;
    iat: number;
}

const AUTHENTICATE_ENDPOINT: ApiEndpoint = {
    service: 'LOGIN',
    apiPath: 'auth/authenticate',
    actionType: ActionTypes.LOGIN,
};

const SSO_AUTHENTICATE_ENDPOINT: ApiEndpoint = {
    service: 'LOGIN',
    apiPath: 'auth/sso/authenticate',
    actionType: ActionTypes.LOGIN,
};

const AUTH_CONFIG_ENDPOINT: ApiEndpoint = {
    service: 'LOGIN',
    apiPath: 'auth/config',
    actionType: ActionTypes.LOGIN,
};

interface KeycloakTokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private logoutTimerId: ReturnType<typeof setTimeout> | null = null;

    constructor(private http: HttpClient,
                private apiService: ApiService,
                private layoutService: LayoutService,
                private sidebarMenuService: SidebarMenuService,
                private router: Router,
    ) {
        const token = this.getToken();
        if (token) {
            if (this.isTokenExpired(token)) {
                this.logout(false);
            } else {
                this.decodeAndSetUser(token);
            }
        }
    }

    login(username: string, password: string) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('privilegeCodes');
        localStorage.removeItem('sidebarMenus');

        return this.apiService.post<AuthResponse | { data: AuthResponse }>(AUTHENTICATE_ENDPOINT, { username, password })
            .pipe(
                map(response => this.unwrapAuthResponse(response)),
                switchMap(res => {
                    if (res?.accessToken) {
                        localStorage.setItem('token', res.accessToken);
                        localStorage.setItem('refreshToken', res.refreshToken || '');
                        this.decodeAndSetUser(res.accessToken);
                        return this.sidebarMenuService.loadApplicationContext().pipe(
                            catchError(error => {
                                console.error('Application context load failed after login', error);
                                localStorage.setItem('privilegeCodes', JSON.stringify([]));
                                localStorage.setItem('sidebarMenus', JSON.stringify([]));
                                return of({ menus: [], privilegeCodes: [] });
                            })
                        );
                    }
                    return throwError(() => new Error('Authentication response does not contain access token'));
                })
            );
    }

    loadAuthConfig(): Observable<AuthConfig> {
        return this.apiService.post<AuthConfig | { data: AuthConfig }>(AUTH_CONFIG_ENDPOINT, {})
            .pipe(
                map(response => this.unwrapAuthConfig(response)),
                map(config => {
                    localStorage.setItem('authMode', config.authMode);
                    localStorage.setItem('authConfig', JSON.stringify(config));
                    return config;
                })
            );
    }

    loginWithSso(): Observable<void> {
        this.clearAuthStorage();
        localStorage.removeItem('keycloakIdToken');

        return this.loadAuthConfig().pipe(
            switchMap(config => from(this.redirectToKeycloak(config)))
        );
    }

    handleSsoCallback(callbackUrl: string = window.location.href): Observable<void> {
        const url = new URL(callbackUrl);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const storedState = sessionStorage.getItem('kc_state');
        const verifier = sessionStorage.getItem('kc_code_verifier');

        if (!code || !state || !storedState || state !== storedState || !verifier) {
            return throwError(() => new Error('Invalid SSO callback'));
        }

        const config$ = this.getStoredAuthConfig()
            ? of(this.getStoredAuthConfig() as AuthConfig)
            : this.loadAuthConfig();

        return config$.pipe(
            switchMap(config => this.exchangeCodeForToken(config, code, verifier)),
            switchMap(tokenResponse => this.apiService.post<AuthResponse | { data: AuthResponse }>(
                SSO_AUTHENTICATE_ENDPOINT,
                { accessToken: tokenResponse.access_token }
            ).pipe(
                map(response => ({ authResponse: this.unwrapAuthResponse(response), tokenResponse }))
            )),
            switchMap(({ authResponse, tokenResponse }) => {
                this.clearAuthStorage();
                localStorage.setItem('token', authResponse.accessToken);
                localStorage.setItem('refreshToken', authResponse.refreshToken || '');
                localStorage.setItem('keycloakIdToken', tokenResponse.id_token || '');
                this.decodeAndSetUser(authResponse.accessToken);
                this.clearSsoSessionStorage();

                return this.sidebarMenuService.loadApplicationContext().pipe(
                    map(() => undefined),
                    catchError(error => {
                        console.error('Application context load failed after SSO login', error);
                        localStorage.setItem('privilegeCodes', JSON.stringify([]));
                        localStorage.setItem('sidebarMenus', JSON.stringify([]));
                        return of(undefined);
                    })
                );
            })
        );
    }

    logout(redirectToLogin: boolean = true) {
        const authMode = localStorage.getItem('authMode');
        const authConfig = this.getStoredAuthConfig();
        const keycloakIdToken = localStorage.getItem('keycloakIdToken');

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('privilegeCodes');
        localStorage.removeItem('sidebarMenus');
        localStorage.removeItem('keycloakIdToken');
        this.clearLogoutTimer();
        this.currentUserSubject.next(null);
        this.layoutService.setPublicLayout();

        if (redirectToLogin && authMode === 'SSO' && authConfig?.issuerUri) {
            const logoutUrl = new URL(`${authConfig.issuerUri}/protocol/openid-connect/logout`);
            logoutUrl.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/login`);
            if (keycloakIdToken) {
                logoutUrl.searchParams.set('id_token_hint', keycloakIdToken);
            }
            window.location.href = logoutUrl.toString();
            return;
        }

        if (redirectToLogin) {
            this.router.navigate(['/login']);
        }
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    private decodeAndSetUser(token: string) {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            console.log('decoded',decoded)
            this.currentUserSubject.next(decoded);
            this.scheduleAutoLogout(decoded.exp);
        } catch (err) {
            console.error('JWT Decode failed', err);
            this.logout();
        }
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        if (this.isTokenExpired(token)) {
            this.logout();
            return false;
        }

        return true;
    }

    handleSessionExpired(): void {
        this.logout();
    }

    hasRole(role: string): boolean {
        return this.currentUserSubject.value?.roles?.includes(role) ?? false;
    }

    hasPrivilege(privilegeCode: string): boolean {
        const privilegeCodes = JSON.parse(localStorage.getItem('privilegeCodes') || '[]') as string[];
        return privilegeCodes.includes(privilegeCode);
    }

    private isTokenExpired(token: string): boolean {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            return decoded.exp * 1000 <= Date.now();
        } catch {
            return true;
        }
    }

    private scheduleAutoLogout(expirationInSeconds: number): void {
        this.clearLogoutTimer();

        const remainingMs = expirationInSeconds * 1000 - Date.now();
        if (remainingMs <= 0) {
            this.logout();
            return;
        }

        this.logoutTimerId = setTimeout(() => {
            this.logout();
        }, remainingMs);
    }

    private clearLogoutTimer(): void {
        if (this.logoutTimerId) {
            clearTimeout(this.logoutTimerId);
            this.logoutTimerId = null;
        }
    }

    private unwrapAuthResponse(response: AuthResponse | { data: AuthResponse }): AuthResponse {
        return (response as { data: AuthResponse })?.data || response as AuthResponse;
    }

    private unwrapAuthConfig(response: AuthConfig | { data: AuthConfig }): AuthConfig {
        return (response as { data: AuthConfig })?.data || response as AuthConfig;
    }

    private async redirectToKeycloak(config: AuthConfig): Promise<void> {
        if (config.authMode !== 'SSO' || !config.issuerUri || !config.clientId || !config.redirectUri) {
            throw new Error('SSO is not configured');
        }

        const verifier = this.randomString(64);
        const challenge = await this.pkceChallenge(verifier);
        const state = this.randomString(32);

        sessionStorage.setItem('kc_code_verifier', verifier);
        sessionStorage.setItem('kc_state', state);
        localStorage.setItem('authConfig', JSON.stringify(config));

        const authorizationUrl = new URL(`${config.issuerUri}/protocol/openid-connect/auth`);
        authorizationUrl.searchParams.set('client_id', config.clientId);
        authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set('scope', 'openid profile email');
        authorizationUrl.searchParams.set('state', state);
        authorizationUrl.searchParams.set('code_challenge', challenge);
        authorizationUrl.searchParams.set('code_challenge_method', 'S256');

        window.location.href = authorizationUrl.toString();
    }

    private exchangeCodeForToken(config: AuthConfig, code: string, verifier: string): Observable<KeycloakTokenResponse> {
        if (!config.issuerUri || !config.clientId || !config.redirectUri) {
            return throwError(() => new Error('SSO token exchange is not configured'));
        }

        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', config.clientId);
        body.set('redirect_uri', config.redirectUri);
        body.set('code', code);
        body.set('code_verifier', verifier);

        return this.http.post<KeycloakTokenResponse>(
            `${config.issuerUri}/protocol/openid-connect/token`,
            body.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
    }

    private getStoredAuthConfig(): AuthConfig | null {
        const rawConfig = localStorage.getItem('authConfig');
        if (!rawConfig) {
            return null;
        }

        try {
            return JSON.parse(rawConfig) as AuthConfig;
        } catch {
            return null;
        }
    }

    private clearAuthStorage(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('privilegeCodes');
        localStorage.removeItem('sidebarMenus');
    }

    private clearSsoSessionStorage(): void {
        sessionStorage.removeItem('kc_code_verifier');
        sessionStorage.removeItem('kc_state');
    }

    private randomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        return Array.from(values).map(value => charset[value % charset.length]).join('');
    }

    private async pkceChallenge(verifier: string): Promise<string> {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(digest));
    }

    private base64UrlEncode(bytes: Uint8Array): string {
        const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
}
