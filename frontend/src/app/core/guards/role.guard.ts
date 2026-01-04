import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        const requiredRole = route.data['role'] as string;
        const userRole = this.authService.getRole();

        console.log('RoleGuard: Required role:', requiredRole);
        console.log('RoleGuard: User role:', userRole);

        if (userRole === requiredRole) {
            return true;
        }

        // User doesn't have the required role
        console.log('RoleGuard: Access denied, redirecting to home');

        // Redirect to home page (or show unauthorized page)
        this.router.navigate(['/home']);

        return false;
    }
}
