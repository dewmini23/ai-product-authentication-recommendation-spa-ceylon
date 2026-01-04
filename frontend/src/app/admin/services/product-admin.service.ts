import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductCreateRequest, ProductResponse } from '../models/product-api.model';

@Injectable({
    providedIn: 'root'
})
export class ProductAdminService {
    private readonly apiUrl = `${environment.apiBaseUrl}/api/products`;

    constructor(private http: HttpClient) { }

    createProduct(payload: ProductCreateRequest): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(this.apiUrl, payload);
    }

    updateProduct(id: number, payload: Partial<ProductCreateRequest>): Observable<ProductResponse> {
        return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, payload);
    }

    getProduct(id: number): Observable<ProductResponse> {
        return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
    }

    listProducts(params?: {
        category_id?: number;
        q?: string;
        is_trending?: boolean;
        is_new_arrival?: boolean;
        is_award_winner?: boolean;
        is_festive?: boolean;
        for_men?: boolean;
        page?: number;
        limit?: number;
        sort?: string;
    }): Observable<ProductResponse[]> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }

        return this.http.get<ProductResponse[]>(this.apiUrl, { params: httpParams });
    }

    deleteProduct(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    // Backward-compatible methods for other components
    getProducts(): Observable<ProductResponse[]> {
        return this.listProducts();
    }

    createDraft(payload: any): Observable<ProductResponse> {
        // Draft is just a create operation (backend doesn't distinguish)
        return this.createProduct(payload);
    }

    publishProduct(id: number, payload: any): Observable<ProductResponse> {
        // Publish is just an update operation
        return this.updateProduct(id, payload);
    }
}
