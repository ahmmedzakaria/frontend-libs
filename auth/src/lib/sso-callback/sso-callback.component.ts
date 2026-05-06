import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LayoutService } from '@nexacore/layout';

@Component({
    selector: 'app-sso-callback',
    standalone: true,
    imports: [NgIf],
    template: `
        <div class="d-flex justify-content-center align-items-center vh-80 bg-light">
            <div class="card shadow-sm p-4 text-center" style="min-width: 350px; max-width: 420px;">
                <i class="fa-solid fa-user-shield fa-3x text-primary mb-3"></i>
                <h2 class="fw-bold">Signing in</h2>
                <p class="text-muted mb-0" *ngIf="!errorMessage">Completing SSO login...</p>
                <div *ngIf="errorMessage" class="alert alert-danger py-2 small mt-3">
                    {{ errorMessage }}
                </div>
            </div>
        </div>
    `
})
export class SsoCallbackComponent implements OnInit {
    errorMessage = '';

    constructor(
        private authService: AuthService,
        private layoutService: LayoutService,
        private router: Router
    ) {
    }

    ngOnInit(): void {
        this.authService.handleSsoCallback().subscribe({
            next: () => {
                this.layoutService.setAuthenticatedLayout();
                this.router.navigate(['']);
            },
            error: err => {
                this.errorMessage = err?.error || err?.message || 'SSO login failed';
            }
        });
    }
}
