import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tag {
    id?: number; // Optional for new tags (though backend response has it)
    name: string;
    tag_type: 'skin' | 'hair' | 'perfume' | 'general' | 'face' | 'body' | 'mind' | 'skin_type';
}

// Removed Suggestion interface as it is now just an array of strings in an object.
@Injectable({
    providedIn: 'root'
})
export class TagService {
    private apiUrl = `${environment.apiBaseUrl}`; // Adjust based on env, usually ends with /api

    constructor(private http: HttpClient) { }

    getTags(type?: string, q?: string): Observable<Tag[]> {
        let url = `${this.apiUrl}/api/tags`;
        const params: string[] = [];
        if (type) {
            params.push(`tag_type=${type}`);
        }
        if (q) {
            params.push(`q=${encodeURIComponent(q)}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        return this.http.get<Tag[]>(url);
    }

    getProductTags(productId: number): Observable<Tag[]> {
        return this.http.get<Tag[]>(`${this.apiUrl}/api/products/${productId}/tags`);
    }

    replaceProductTags(productId: number, payload: { tags: { name: string, tag_type: string }[] }): Observable<Tag[]> {
        return this.http.post<Tag[]>(`${this.apiUrl}/api/products/${productId}/tags`, payload);
    }
}
