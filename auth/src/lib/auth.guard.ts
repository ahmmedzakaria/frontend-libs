import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    return authService.loadAuthConfig().pipe(
        switchMap(config => {
            if (config.authMode === 'SSO' && authService.isAutoSsoSuppressed()) {
                return of(router.createUrlTree(['/login']));
            }

            if (config.authMode === 'SSO') {
                return authService.loginWithSso(state.url).pipe(map(() => false));
            }

            return of(router.createUrlTree(['/login']));
        }),
        catchError(() => of(router.createUrlTree(['/login'])))
    );
};
