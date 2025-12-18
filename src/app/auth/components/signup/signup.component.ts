import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

    signupForm!: FormGroup;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.signupForm = this.fb.group({
            fullName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            age: ['', [Validators.required, Validators.pattern('^[0-9]*$')]], // Numeric only
            gender: ['', [Validators.required]],
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

        const userData = this.signupForm.value;
        // Remove confirmPassword before sending if backend doesn't need it
        const { confirmPassword, ...payload } = userData;

        this.authService.register(payload).subscribe({
            next: (res) => {
                console.log('Registration success:', res);
                this.router.navigate(['/login']);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Registration error:', err);
                this.errorMessage = 'Registration failed. Please try again.';
                this.isLoading = false;
            }
        });
    }
}
