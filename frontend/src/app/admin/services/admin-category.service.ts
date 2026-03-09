import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdminCategoryService {

    private readonly apiUrl = `${environment.apiBaseUrl}/api/categories`;

    // Fallback in case the API is unavailable
    private readonly fallbackCategories = [
        { id: 1, name: 'Face' },
        { id: 2, name: 'Hair' },
        { id: 3, name: 'Body' },
        { id: 4, name: 'Fragrances' },
        { id: 5, name: 'Wellness' },
        { id: 6, name: 'Gifts' },
        { id: 8, name: 'Eyes' },
        { id: 9, name: 'Lips' }
    ];

    constructor(private http: HttpClient) { }

    getCategories(): Observable<{ id: number, name: string }[]> {
        return this.http.get<{ id: number, name: string }[]>(this.apiUrl).pipe(
            catchError(() => {
                console.warn('Categories API unavailable, using fallback list');
                return of(this.fallbackCategories);
            })
        );
    }
}
