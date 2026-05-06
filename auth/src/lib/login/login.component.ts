import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from "../auth.service";
import {LayoutService} from "@nexacore/layout";
import {NgIf} from "@angular/common";


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
        ReactiveFormsModule,
        NgIf
    ],

})
export class LoginComponent {
    form: FormGroup;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private layoutService: LayoutService
    ) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    login() {
        if (this.form.invalid) return;

        const { username, password } = this.form.value;

        this.authService.login(username, password).subscribe({
            next: () => {
                console.log('login success setting layout');
                this.layoutService.setAuthenticatedLayout(); // ✅ switch layout
                this.router.navigate(['']);
            },
            error: err => {
                this.errorMessage = err?.error || 'Login failed';
            }
        });
    }
}
