import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    loginForm!: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get f() { return this.loginForm.controls; }

    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { email, password } = this.loginForm.value;

        this.authService.login({ email, password }).pipe(
            finalize(() => {
                this.isLoading = false;
                console.log('LOGIN COMPLETE - isLoading set to false');
            })
        ).subscribe({
            next: (res) => {
                console.log('LOGIN RESPONSE:', res);
                console.log('STORED ROLE:', localStorage.getItem('role'));
                console.log('STORED TOKEN:', localStorage.getItem('access_token'));

                // Use AuthService to handle role-based navigation
                this.authService.navigateByRole(res.role);
            },
            error: (err) => {
                console.error('Login error:', err);
                this.errorMessage = err.error?.detail || 'Login failed. Please check your credentials.';
            }
        });
    }

    onGoogleLogin(): void {
        // Google login not implemented
        console.log('Google login not implemented');
    }
}
