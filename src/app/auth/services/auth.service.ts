import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    // Mock API URL - FastAPI endpoint
    private apiUrl = 'http://localhost:8000/api/auth/login';

    constructor(private http: HttpClient) { }

    login(credentials: { email: string; password: string }): Observable<any> {
        // For Development without BackendMock the HTTP request using HttpClient pointed to a placeholder URL

        // We will assume the backend might not be there.
        // However, the prompt says "For now, mock the HTTP request...".

        return this.http.post(this.apiUrl, credentials).pipe(
            tap(response => {
                // Save token if real response
                // localStorage.setItem('auth_token', response.token);
            })
        );
    }

    loginWithGoogle(): void {
        console.log('Use implementation for Google OAuth here');
        // Stub
    }

    register(userData: any): Observable<any> {
        // Mock registration API call
        // return this.http.post('http://localhost:8000/api/auth/register', userData);

        // For UI Demo: Return success observable
        return of({ message: 'User registered successfully', userId: 123 }).pipe(delay(1000));
    }

    // Helper to simulate saving token for testing interceptor
    saveToken(token: string) {
        localStorage.setItem('auth_token', token);
    }
}
