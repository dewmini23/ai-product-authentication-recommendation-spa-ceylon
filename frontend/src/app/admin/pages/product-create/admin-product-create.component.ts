import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelect } from '@angular/material/select';
import { ProductAdminService } from '../../services/product-admin.service';
import { AdminProduct } from '../../models/admin-product.model';
import { ProductCreateRequest } from '../../models/product-api.model';
import { AdminCategoryService } from '../../services/admin-category.service';

@Component({
    selector: 'app-admin-product-create',
    templateUrl: './admin-product-create.component.html',
    styleUrls: ['./admin-product-create.component.scss']
})
export class AdminProductCreateComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('categorySelect') categorySelect!: MatSelect;

    productForm!: FormGroup;
    isLoading = false;
    private scrollListener?: () => void;

    categories: { id: number, name: string }[] = [];

    selectedCategoryName: string | null = null;

    // Checklist State
    checklist = {
        description: false,
        images: false
    };

    formSubmitted = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private productService: ProductAdminService,
        private snackBar: MatSnackBar,
        private categoryService: AdminCategoryService
    ) {
    }

    ngOnInit(): void {
        this.initForm();
        this.setupChecklistListener();

        // Load categories from service
        this.categoryService.getCategories().subscribe(cats => {
            this.categories = cats;
        });

        // Keep selectedCategoryName in sync with form value
        this.productForm.get('category_id')?.valueChanges.subscribe((id) => {
            const found = this.categories.find(c => c.id === id);
            this.selectedCategoryName = found?.name ?? '';
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                this.scrollListener = () => {
                    if (this.categorySelect?.panelOpen) {
                        this.categorySelect.close();
                    }
                };
                contentArea.addEventListener('scroll', this.scrollListener);
            }
        });
    }

    ngOnDestroy(): void {
        const contentArea = document.querySelector('.content-area');
        if (contentArea && this.scrollListener) {
            contentArea.removeEventListener('scroll', this.scrollListener);
        }
    }

    // Accessors
    get highlights() { return this.productForm.get('ingredient_highlights') as FormArray; }
    get images() { return this.productForm.get('images') as FormArray; }

    initForm() {
        this.productForm = this.fb.group({
            // SECTION 1: BASICS
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
            category_id: [null, Validators.required],
            price_lkr: [null, [Validators.required, Validators.min(0)]],
            stock_qty: [null, [Validators.required, Validators.min(0)]],

            // SECTION 2: CONTENT
            short_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(250)]],
            description: ['', [Validators.minLength(20)]], // Validate on Publish
            ingredients: [''],
            how_to_use: [''],

            // SECTION 3: VISIBILITY
            is_new_arrival: [false],
            is_trending: [false],
            is_award_winner: [false],
            is_festive: [false],
            for_men: [false],

            // SECTION 6: META (Advanced)
            rating: [0, [Validators.min(0), Validators.max(5)]],
            review_count: [0, [Validators.min(0)]],

            // ARRAYS
            ingredient_highlights: this.fb.array([]),
            images: this.fb.array([])
        });
    }

    clearCategory(e: Event) {
        e.stopPropagation();
        this.productForm.patchValue({ category_id: null });
        this.selectedCategoryName = null;
    }

    setupChecklistListener() {
        this.productForm.valueChanges.subscribe(val => {
            this.checklist.description = (val.description && val.description.length >= 20);
            this.checklist.images = (this.images.length > 0);
        });
    }

    // --- Array Helpers ---

    addHighlight() {
        this.highlights.push(this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(60)]],
            description: ['', [Validators.required, Validators.maxLength(200)]]
        }));
    }

    removeHighlight(index: number) {
        this.highlights.removeAt(index);
    }

    triggerFileInput() {
        const fileInput = document.getElementById('fileUploadInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: any) {
        if (event.target.files && event.target.files.length) {
            const files = event.target.files;

            // Convert to Base64
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    const result = e.target.result; // Base64 string
                    this.images.push(this.fb.control(result, Validators.required));
                };
                reader.readAsDataURL(file);
            }
        }
    }

    removeImage(index: number) {
        this.images.removeAt(index);
    }


    onImgError(event: any) {
        event.target.src = 'assets/placeholder-product.jpg';
    }


    // --- Actions ---

    cancel() {
        if (this.productForm.dirty && !confirm('Discard unsaved changes?')) return;
        this.router.navigate(['/admin/products']);
    }

    saveDraft() {
        this.formSubmitted = true;

        if (this.productForm.invalid) {
            const f = this.productForm.controls;
            const basicsInvalid = f['name'].invalid || f['category_id'].invalid ||
                f['price_lkr'].invalid || f['stock_qty'].invalid ||
                f['short_description'].invalid;

            if (basicsInvalid) {
                this.snackBar.open('Please complete required fields.', 'Close', { duration: 3000 });
                this.productForm.markAllAsTouched();
                return;
            }
        }

        // Draft functionality not implemented yet - just log for now
        console.log('💾 Draft saved (not implemented):', this.productForm.value);
        this.snackBar.open('Draft saved locally', 'Close', { duration: 2000 });
    }


    publish() {
        this.formSubmitted = true;

        const f = this.productForm.controls;

        // 1. Check Basics
        if (this.productForm.invalid) {
            this.snackBar.open('Form contains errors. Please review.', 'Close', { duration: 3000 });
            this.productForm.markAllAsTouched();
            return;
        }

        // 2. Check Publish Rules
        if (!this.checklist.description) {
            this.snackBar.open('Full Description must be at least 20 chars.', 'Close', { duration: 3000 });
            return;
        }

        if (!this.checklist.images) {
            this.snackBar.open('At least 1 product image is required.', 'Close', { duration: 3000 });
            return;
        }

        this.isLoading = true;
        const payload = this.buildProductPayload();

        this.productService.createProduct(payload).subscribe({
            next: (response) => {
                this.isLoading = false;
                console.log('✅ Product Created:', response);
                this.snackBar.open('Product Published Live!', 'Close', { duration: 3000 });
                this.router.navigate(['/admin/products']);
            },
            error: (error: any) => {
                this.isLoading = false;
                console.error('❌ Error creating product:', error);
                const message = error.error?.detail || error.message || 'Failed to create product';
                this.snackBar.open(`Error: ${message}`, 'Close', { duration: 5000 });
            }
        });
    }

    // --- Payload Mapper ---
    private buildProductPayload(): ProductCreateRequest {
        const formValue = this.productForm.value;

        // Helper: safe number conversion (avoid NaN)
        const toNumber = (val: any): number | undefined => {
            const num = Number(val);
            return isNaN(num) || val === null || val === undefined ? undefined : num;
        };

        // Helper: trim and return undefined if empty
        const trimOrUndefined = (val: string | null | undefined): string | undefined => {
            const trimmed = (val || '').trim();
            return trimmed.length > 0 ? trimmed : undefined;
        };

        // Convert images FormArray to backend format
        const images = (formValue.images || [])
            .map((url: string, index: number) => ({
                image_url: url?.trim() || '',
                sort_order: index,
                is_primary: index === 0
            }))
            .filter((img: any) => img.image_url.length > 0);

        // Filter out empty ingredient highlights
        const ingredientHighlights = (formValue.ingredient_highlights || [])
            .filter((h: any) => h.name?.trim() && h.description?.trim());

        return {
            name: formValue.name,
            category_id: formValue.category_id,
            price_lkr: toNumber(formValue.price_lkr) || 0,
            stock_qty: toNumber(formValue.stock_qty) || 0,
            short_description: trimOrUndefined(formValue.short_description),
            description: trimOrUndefined(formValue.description),
            ingredients: trimOrUndefined(formValue.ingredients),
            how_to_use: trimOrUndefined(formValue.how_to_use),
            rating: toNumber(formValue.rating) || 0,
            review_count: toNumber(formValue.review_count) || 0,
            is_trending: Boolean(formValue.is_trending),
            is_new_arrival: Boolean(formValue.is_new_arrival),
            is_award_winner: Boolean(formValue.is_award_winner),
            is_festive: Boolean(formValue.is_festive),
            for_men: Boolean(formValue.for_men),
            ingredient_highlights: ingredientHighlights.length > 0 ? ingredientHighlights : undefined,
            images: images.length > 0 ? images : undefined
        };
    }

    // --- Helpers ---

    showError(controlName: string): boolean {
        const control = this.productForm.get(controlName);
        return !!(control && control.invalid && (control.touched || this.formSubmitted));
    }
}
