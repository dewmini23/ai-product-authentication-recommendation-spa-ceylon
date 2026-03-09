import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthBoundingBox {
    class_name: string;
    confidence: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface AuthOcrResult {
    brand_text_raw: string | null;
    label_text_raw: string | null;
}

export interface AuthVerifyResponse {
    status: 'verified' | 'unable_to_verify' | 'suspected_counterfeit';
    score: number;
    reasons: string[];
    detections: AuthBoundingBox[];
    ocr_text: AuthOcrResult;
    debug: Record<string, any>;
}

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    verifyProduct(file: File): Observable<AuthVerifyResponse> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<AuthVerifyResponse>(
            `${this.apiUrl}/api/authentication/verify`,
            formData
        );
    }
}
