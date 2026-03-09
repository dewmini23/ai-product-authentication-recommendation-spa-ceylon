import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type NormalizedRec = {
    product: any;
    score?: number;
    matched_tags?: string[];
    matched_types?: string[];
};

@Injectable({
    providedIn: 'root'
})
export class RecommendationsService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    predictTags(text: string, threshold: number = 0.5): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/api/ml/predict-tags`, {
            text,
            threshold
        });
    }

    getRecommendations(tags: string[], limit: number = 12): Observable<any> {
        let params = new HttpParams()
            .set('concern_tags', tags.join(','))
            .set('limit', limit.toString());

        return this.http.get<any>(`${this.apiUrl}/api/recommendations/products`, { params });
    }

    normalizeRecommendationsResponse(res: any): NormalizedRec[] {
        let items: any[] = [];

        if (Array.isArray(res)) {
            items = res;
        } else if (res && Array.isArray(res.items)) {
            items = res.items;
        } else if (res && Array.isArray(res.value)) {
            items = res.value;
        } else if (res && Array.isArray(res.recommendations)) {
            items = res.recommendations;
        }

        return items.map(item => {
            if (item && item.product) {
                return {
                    product: item.product,
                    score: item.score,
                    matched_tags: item.matched_tags || [],
                    matched_types: item.matched_types || []
                };
            } else {
                return {
                    product: item,
                    score: undefined,
                    matched_tags: [],
                    matched_types: []
                };
            }
        });
    }
}
