import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    skin_type?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface UserOut {
    id: number;
    full_name: string;
    email: string;
    age?: number;
    gender?: string;
    skin_type?: string;
    role: string;
    created_at: string;
}

export interface RegisterResponse {
    message: string;
    user: UserOut;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    role: string;
    user_id: number;
    full_name: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiBaseUrl}/api/auth`;
    private currentUserSubject = new BehaviorSubject<UserOut | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        // Load user from localStorage on init
        this.loadUserFromStorage();
    }

    private loadUserFromStorage(): void {
        const token = this.getToken();
        if (token) {
            // Could optionally call /auth/me to validate token
            // For now, just mark as logged in
        }
    }

    register(payload: RegisterPayload): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, payload);
    }

    login(payload: LoginPayload): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(`${this.apiUrl}/login`, payload).pipe(
            tap(response => {
                console.log('AuthService: Received response:', response);

                // Store token and user info
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('role', response.role);
                localStorage.setItem('user_id', response.user_id.toString());
                localStorage.setItem('full_name', response.full_name);

                console.log('AuthService: Stored in localStorage');
                console.log('  - access_token:', response.access_token.substring(0, 20) + '...');
                console.log('  - role:', response.role);
                console.log('  - user_id:', response.user_id);
                console.log('  - full_name:', response.full_name);

                // Navigation will be handled by the component
            })
        );
    }

    me(): Observable<UserOut> {
        return this.http.get<UserOut>(`${this.apiUrl}/me`).pipe(
            tap(user => {
                this.currentUserSubject.next(user);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('full_name');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    getRole(): string | null {
        return localStorage.getItem('role');
    }

    getUserId(): number | null {
        const id = localStorage.getItem('user_id');
        return id ? parseInt(id) : null;
    }

    getFullName(): string | null {
        return localStorage.getItem('full_name');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    hasRole(role: string): boolean {
        return this.getRole() === role;
    }

    public navigateByRole(role: string): void {
        console.log('navigateByRole called with role:', role);
        if (role === 'ADMIN') {
            console.log('Navigating to /admin-dashboard');
            this.router.navigate(['/admin-dashboard']);
        } else {
            console.log('Navigating to /home (default for CUSTOMER)');
            this.router.navigate(['/home']);
        }
    }
}
