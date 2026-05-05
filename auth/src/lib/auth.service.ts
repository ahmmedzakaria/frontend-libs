import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, BehaviorSubject, switchMap, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {ActionTypes, ApiEndpoint, ApiService, AuthResponse} from "@kyc/api-common";
import {jwtDecode} from "jwt-decode";
import {LayoutService, SidebarMenuService} from "@kyc/layout";
import {ActivatedRoute, Router} from "@angular/router";



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

    logout(redirectToLogin: boolean = true) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('privilegeCodes');
        localStorage.removeItem('sidebarMenus');
        this.clearLogoutTimer();
        this.currentUserSubject.next(null);
        this.layoutService.setPublicLayout();
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
}
