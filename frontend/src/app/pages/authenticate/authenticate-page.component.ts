import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, AuthVerifyResponse } from './authentication.service';

@Component({
    selector: 'app-authenticate-page',
    templateUrl: './authenticate-page.component.html',
    styleUrls: ['./authenticate-page.component.scss']
})
export class AuthenticatePageComponent {
    @ViewChild('resultCard') resultCardRef?: ElementRef;

    selectedFile: File | null = null;
    previewUrl: string | null = null;
    isLoading: boolean = false;
    errorMessage: string | null = null;
    authResult: AuthVerifyResponse | null = null;
    showDeveloperDetails: boolean = false;  // gate: hides technical section entirely from customer view
    showTechnical: boolean = false;          // inner collapse within technical section

    constructor(
        private authService: AuthenticationService,
        private router: Router
    ) { }

    goHome(): void {
        this.router.navigate(['/']);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        this.selectedFile = file;
        this.authResult = null;
        this.errorMessage = null;
        this.showTechnical = false;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    get fileSizeLabel(): string {
        if (!this.selectedFile) return '';
        const kb = this.selectedFile.size / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    }

    verify(): void {
        if (!this.selectedFile || this.isLoading) return;

        this.isLoading = true;
        this.authResult = null;
        this.errorMessage = null;

        this.authService.verifyProduct(this.selectedFile).subscribe({
            next: (result) => {
                this.authResult = result;
                this.isLoading = false;
                // Scroll to result after a brief render tick
                setTimeout(() => {
                    this.resultCardRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage =
                    err?.error?.detail ||
                    err?.message ||
                    'Verification failed. Please try again.';
            }
        });
    }

    reset(): void {
        this.selectedFile = null;
        this.previewUrl = null;
        this.authResult = null;
        this.errorMessage = null;
        this.isLoading = false;
        this.showTechnical = false;
        this.showDeveloperDetails = false;
    }

    toggleDeveloperDetails(): void {
        this.showDeveloperDetails = !this.showDeveloperDetails;
        if (!this.showDeveloperDetails) this.showTechnical = false;
    }

    toggleTechnical(): void {
        this.showTechnical = !this.showTechnical;
    }

    // ── Customer-facing display helpers ──────────────────────────────────────

    get statusIcon(): string {
        switch (this.authResult?.status) {
            case 'verified': return '✅';
            case 'unable_to_verify': return '📸';
            case 'suspected_counterfeit': return '⚠️';
            default: return '';
        }
    }

    get statusLabel(): string {
        switch (this.authResult?.status) {
            case 'verified': return 'Verified Genuine';
            case 'suspected_counterfeit': return 'Suspected Counterfeit';
            case 'unable_to_verify': return 'Unable to Verify';
            default: return '';
        }
    }

    get friendlyMessage(): string {
        switch (this.authResult?.status) {
            case 'verified':
                return 'This product appears authentic based on packaging and label analysis.';
            case 'unable_to_verify':
                return "We couldn't verify this image confidently. Please try a brighter, front-facing photo with the label fully visible.";
            case 'suspected_counterfeit':
                return 'This product shows branding or label inconsistencies and may not be authentic.';
            default:
                return '';
        }
    }

    get nextSteps(): string[] {
        switch (this.authResult?.status) {
            case 'verified':
                return [
                    'Keep your receipt and packaging for future reference.',
                    'Register your product on the official Spa Ceylon website for warranty.',
                    'Purchase from authorised retailers to ensure authenticity.',
                ];
            case 'unable_to_verify':
                return [
                    'Retake the photo in brighter, even lighting.',
                    'Avoid glare — move away from direct light sources.',
                    'Capture the full front label without obstructions.',
                    'Ensure the image is in focus and not blurry.',
                ];
            case 'suspected_counterfeit':
                return [
                    'Stop using the product until authenticity is confirmed.',
                    'Compare packaging carefully with official Spa Ceylon references.',
                    'Contact the seller and request proof of authenticity.',
                    'Report suspicious products to Spa Ceylon support.',
                ];
            default:
                return [];
        }
    }

    get confidenceLabel(): string {
        const score = this.authResult?.score ?? 0;
        if (score >= 75) return 'High confidence';
        if (score >= 45) return 'Moderate confidence';
        return 'Low confidence';
    }

    get confidenceTier(): string {
        const score = this.authResult?.score ?? 0;
        if (score >= 75) return 'high';
        if (score >= 45) return 'moderate';
        return 'low';
    }

    get hasTechnicalDetails(): boolean {
        return !!(
            this.authResult?.ocr_text?.brand_text_raw ||
            this.authResult?.ocr_text?.label_text_raw ||
            (this.authResult?.detections?.length ?? 0) > 0 ||
            this.authResult?.debug
        );
    }

    get debugJson(): string {
        return JSON.stringify(this.authResult?.debug, null, 2);
    }
}
