import { Component, OnInit } from '@angular/core';
import { AuthService, UserOut } from '../../core/services/auth.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    user: UserOut | null = null;
    loading: boolean = true;
    error: string | null = null;

    constructor(private authService: AuthService) { }

    get avatarInitial(): string {
        if (!this.user) return '?';
        if (this.user.full_name) {
            return this.user.full_name.charAt(0);
        }
        if (this.user.email) {
            return this.user.email.charAt(0);
        }
        return '?';
    }

    ngOnInit(): void {
        this.authService.me().subscribe({
            next: (userData) => {
                this.user = userData;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load profile data.';
                this.loading = false;
                console.error('Error loading profile:', err);
            }
        });
    }

    logout(): void {
        this.authService.logout();
    }
}
