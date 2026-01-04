import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        
        if (this.authService.isLoggedIn()) {
            return true;
        }

        // Store the attempted URL for redirecting after login
        console.log('AuthGuard: User not authenticated, redirecting to login');
        
        // Redirect to login page with return URL
        this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
        });
        
        return false;
    }
}
