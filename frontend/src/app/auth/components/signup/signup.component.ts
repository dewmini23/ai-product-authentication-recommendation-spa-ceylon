import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

    signupForm!: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.signupForm = this.fb.group({
            fullName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],  // Backend requires min 8
            confirmPassword: ['', [Validators.required]],
            age: ['', [Validators.pattern('^[0-9]*$')]], // Optional, numeric only
            gender: [''], // Optional
            skinType: [''] // Optional
        }, { validators: this.passwordMatchValidator });
    }

    // Custom validator for password matching
    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        if (!password || !confirmPassword) {
            return null;
        }

        return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    }

    get f() { return this.signupForm.controls; }

    onSubmit(): void {
        if (this.signupForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const formData = this.signupForm.value;

        // Map form fields to backend expected format
        const payload = {
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
            age: formData.age ? parseInt(formData.age) : undefined,
            gender: formData.gender || undefined,
            skin_type: formData.skinType || undefined
        };

        this.authService.register(payload).subscribe({
            next: (res) => {
                console.log('Registration success:', res);
                this.successMessage = res.message || 'Registration successful! Redirecting to login...';
                this.isLoading = false;

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            },
            error: (err) => {
                console.error('Registration error:', err);
                // Extract error message from backend
                if (err.error?.detail) {
                    this.errorMessage = err.error.detail;
                } else if (err.status === 409) {
                    this.errorMessage = 'This email is already registered. Please use a different email.';
                } else {
                    this.errorMessage = 'Registration failed. Please try again.';
                }
                this.isLoading = false;
            }
        });
    }
}
