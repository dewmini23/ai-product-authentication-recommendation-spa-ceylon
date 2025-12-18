import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

        this.authService.login({ email, password }).subscribe({
            next: (res) => {
                console.log('Login success:', res);
                // Navigate to dashboard or home if successful
                // this.router.navigate(['/dashboard']);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Login error:', err);
                // Show generic error for mock
                this.errorMessage = 'Login failed. Please check your credentials.';
                this.isLoading = false;
            }
        });
    }

    onGoogleLogin(): void {
        this.authService.loginWithGoogle();
    }
}
