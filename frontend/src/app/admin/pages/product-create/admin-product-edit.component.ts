import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ProductAdminService } from '../../services/product-admin.service';
import { AdminCategoryService } from '../../services/admin-category.service';
import { AdminProduct } from '../../models/admin-product.model';

@Component({
    selector: 'app-admin-product-edit',
    templateUrl: './admin-product-edit.component.html',
    styleUrls: ['./admin-product-edit.component.scss']
})
export class AdminProductEditComponent implements OnInit {

    productForm!: FormGroup;
    isLoading = true;
    productId: number = 0;
    categories$: Observable<{ id: number, name: string }[]>;
    showChecklist = false;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductAdminService,
        private categoryService: AdminCategoryService,
        private snackBar: MatSnackBar
    ) {
        this.categories$ = this.categoryService.getCategories();
    }

    ngOnInit(): void {
        this.productId = Number(this.route.snapshot.paramMap.get('id'));
        this.initForm();
        this.loadProduct();
    }

    // Accessors for FormArrays
    get highlights() { return this.productForm.get('ingredient_highlights') as FormArray; }
    get images() { return this.productForm.get('images') as FormArray; }

    initForm() {
        this.productForm = this.fb.group({
            // Basics
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
            category_id: [null, Validators.required],
            price_lkr: [0, [Validators.required, Validators.min(0)]],
            stock_qty: [0, [Validators.required, Validators.min(0)]],

            // Content
            short_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(250)]],
            description: ['', [Validators.minLength(20)]],
            ingredients: [''],
            how_to_use: [''],

            // Visibility (Flags)
            is_new_arrival: [false],
            is_trending: [false],
            is_award_winner: [false],
            is_festive: [false],
            for_men: [false],

            // Meta
            rating: [0, [Validators.min(0), Validators.max(5)]],
            review_count: [0, [Validators.min(0)]],

            // Arrays
            ingredient_highlights: this.fb.array([]),
            images: this.fb.array([])
        });
    }

    loadProduct() {
        if (!this.productId) return;

        this.productService.getProduct(this.productId).subscribe({
            next: (product) => {
                if (!product) {
                    this.snackBar.open('Product not found', 'Close');
                    this.router.navigate(['/admin/products']);
                    return;
                }
                this.patchForm(product);
                this.isLoading = false;
            },
            error: () => {
                this.snackBar.open('Error loading product', 'Close');
                this.router.navigate(['/admin/products']);
                this.isLoading = false;
            }
        });
    }

    patchForm(product: any) {
        this.productForm.patchValue({
            name: product.name,
            category_id: product.category_id,
            price_lkr: product.price_lkr,
            stock_qty: product.stock_qty,
            short_description: product.short_description,
            description: product.description,
            ingredients: product.ingredients,
            how_to_use: product.how_to_use,
            is_new_arrival: product.is_new_arrival,
            is_trending: product.is_trending,
            is_award_winner: product.is_award_winner,
            is_festive: product.is_festive,
            for_men: product.for_men,
            rating: product.rating,
            review_count: product.review_count
        });

        // Patch Highlights
        this.highlights.clear();
        if (product.ingredient_highlights) {
            product.ingredient_highlights.forEach((h: any) => {
                this.highlights.push(this.fb.group({
                    name: [h.name, [Validators.required, Validators.maxLength(60)]],
                    description: [h.description, [Validators.required, Validators.maxLength(200)]]
                }));
            });
        }

        // Patch Images
        this.images.clear();
        if (product.images) {
            product.images.forEach((url: any) => {
                this.images.push(this.fb.control(url, Validators.required));
            });
        }
    }

    // --- Array Actions ---

    addHighlight() {
        this.highlights.push(this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(60)]],
            description: ['', [Validators.required, Validators.maxLength(200)]]
        }));
    }

    removeHighlight(index: number) {
        this.highlights.removeAt(index);
    }

    addImage() {
        this.images.push(this.fb.control('', Validators.required));
    }

    removeImage(index: number) {
        this.images.removeAt(index);
    }

    onImgError(event: any) {
        event.target.src = 'assets/placeholder-product.jpg';
    }

    // --- Actions ---

    cancel() {
        this.router.navigate(['/admin/products']);
    }

    discardChanges() {
        if (confirm('Discard unsaved changes?')) {
            this.isLoading = true;
            this.loadProduct(); // Reload from source
        }
    }

    saveDraft() {
        if (this.productForm.invalid) {
            // Drafts can be partial, but let's at least enforce basics if they are touched
            // Actually, requirements say "Save Draft validates only: name, category_id, price_lkr, stock_qty, short_description"
            // My form has Validators.required on them. 
            // If invalid, I should check WHICH fields are invalid.
            const basicsValid = !this.productForm.get('name')?.invalid &&
                !this.productForm.get('category_id')?.invalid &&
                !this.productForm.get('price_lkr')?.invalid &&
                !this.productForm.get('stock_qty')?.invalid &&
                !this.productForm.get('short_description')?.invalid;

            if (!basicsValid) {
                this.snackBar.open('Draft requirements not met (Basics + Short Desc)', 'Close', { duration: 3000 });
                this.productForm.markAllAsTouched(); // Show errors
                return;
            }
        }

        this.isLoading = true;
        const payload = this.preparePayload();
        this.productService.updateProduct(this.productId, payload).subscribe(() => {
            this.isLoading = false;
            this.snackBar.open('Draft Saved Successfully', 'Close', { duration: 3000 });
        });
    }

    publish() {
        const check = this.isPublishReady();
        this.showChecklist = true;

        if (!check.valid) {
            this.snackBar.open('Cannot Publish: Review requirements.', 'Close', { duration: 3000 });
            this.productForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const payload = this.preparePayload();
        this.productService.publishProduct(this.productId, payload).subscribe(() => {
            this.isLoading = false;
            this.snackBar.open('Product Published Live!', 'Close', { duration: 3000 });
            this.router.navigate(['/admin/products']);
        });
    }

    // --- Helpers ---

    preparePayload(): any {
        const formValue = this.productForm.value;

        // Convert images array to backend format if needed
        const images = (formValue.images || []).map((url: string, index: number) => ({
            image_url: url,
            sort_order: index,
            is_primary: index === 0
        }));

        return {
            ...formValue,
            images: images.length > 0 ? images : undefined
        };
    }

    isPublishReady(): { valid: boolean, errors: string[] } {
        const errors: string[] = [];
        const val = this.productForm.value;

        // 1. Description min 20
        if (!val.description || val.description.length < 20) {
            errors.push('Description must be at least 20 chars.');
        }

        // 2. Images >= 1
        if (this.images.length < 1) {
            errors.push('At least 1 product image is required.');
        }

        // 3. Basics must be valid (Form valid check usually covers this, but let's be explicit)
        if (this.productForm.get('name')?.invalid || this.productForm.get('price_lkr')?.invalid) {
            errors.push('Basic info is incomplete.');
        }

        return { valid: errors.length === 0, errors };
    }
}
