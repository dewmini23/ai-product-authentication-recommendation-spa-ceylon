import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiBaseUrl}/api/products`;

    constructor(private http: HttpClient) { }

    getTrendingProducts(limit: number = 10): Observable<Product[]> {
        let params = new HttpParams()
            .set('is_trending', 'true')
            .set('limit', limit.toString());

        return this.http.get<any[]>(this.apiUrl, { params }).pipe(
            map(products => products.map(p => this.mapToUIProduct(p)))
        );
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(p => this.mapToUIProduct(p))
        );
    }

    getAllProducts(limit?: number): Observable<Product[]> {
        let params = new HttpParams();
        if (limit) {
            params = params.set('limit', limit.toString());
        }
        return this.http.get<any[]>(this.apiUrl, { params }).pipe(
            map(products => products.map(p => this.mapToUIProduct(p)))
        );
    }

    getNewArrivals(limit: number = 8): Observable<Product[]> {
        let params = new HttpParams()
            .set('is_new_arrival', 'true')
            .set('limit', limit.toString())
            .set('sort', 'latest');

        return this.http.get<any[]>(this.apiUrl, { params }).pipe(
            map(products => products.map(p => this.mapToUIProduct(p)))
        );
    }

    getAwardWinners(limit: number = 8): Observable<Product[]> {
        let params = new HttpParams()
            .set('is_award_winner', 'true')
            .set('limit', limit.toString())
            .set('sort', 'rating_desc');

        return this.http.get<any[]>(this.apiUrl, { params }).pipe(
            map(products => products.map(p => this.mapToUIProduct(p)))
        );
    }

    /**
     * Maps backend product data to frontend Product model
     * Handles field name differences between backend and frontend
     */
    private mapToUIProduct(backendProduct: any): Product {
        return {
            ...backendProduct,
            imageUrl: backendProduct.primary_image_url || backendProduct.imageUrl || '',
            price: backendProduct.price_lkr || backendProduct.price || 0,
            isVerified: true,
            isAwardWinner: backendProduct.isAwardWinner || backendProduct.is_award_winner || false
        };
    }
}

