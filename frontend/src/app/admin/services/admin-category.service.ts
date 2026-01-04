import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AdminCategoryService {

    private categories = [
        { id: 1, name: 'Skin' },
        { id: 2, name: 'Hair' },
        { id: 3, name: 'Body' },
        { id: 4, name: 'Fragrances' },
        { id: 5, name: 'Wellness' },
        { id: 6, name: 'Gifts' },
        { id: 7, name: 'Face' },
        { id: 8, name: 'Eyes' },
        { id: 9, name: 'Lips' }
    ];

    constructor() { }

    getCategories(): Observable<{ id: number, name: string }[]> {
        return of([...this.categories]).pipe(delay(300));
    }
}
