import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ProductAdminService } from '../../services/product-admin.service';
import { AdminCategoryService } from '../../services/admin-category.service';
import { AdminProduct } from '../../models/admin-product.model';
import { TagService, Tag } from '../../services/tag.service';

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
        private tagService: TagService,
        private snackBar: MatSnackBar,
        private http: HttpClient
    ) {
        this.categories$ = this.categoryService.getCategories();
    }

    ngOnInit(): void {
        this.productId = Number(this.route.snapshot.paramMap.get('id'));
        this.initForm();
        this.loadProduct();
        this.initForm();
        this.loadProduct();
        if (this.productId) {
            this.loadTags();
        }
        this.loadSkinTypes();
        this.loadAvailableTags(this.newTagTypeInput);
    }

    // Tags
    tags: Tag[] = [];
    availableSkinTypes: Tag[] = [];
    availableTags: Tag[] = [];
    newTagInput = '';
    newTagTypeInput: 'face' | 'hair' | 'body' | 'mind' | 'perfume' | 'general' = 'face';

    get concernTags(): Tag[] {
        return this.tags.filter(t => t.tag_type !== 'skin_type');
    }

    get skinTypeTags(): Tag[] {
        return this.tags.filter(t => t.tag_type === 'skin_type');
    }

    loadTags() {
        this.tagService.getProductTags(this.productId).subscribe({
            next: (tags) => this.tags = tags,
            error: (err) => console.error('Failed to load tags', err)
        });
    }

    loadSkinTypes() {
        this.tagService.getTags('skin_type').subscribe({
            next: (tags) => this.availableSkinTypes = tags,
            error: (err) => console.error('Failed to load skin types', err)
        });
    }

    addTag(name: string, type: any = this.newTagTypeInput) {
        let trimmed = name?.trim().toLowerCase();
        // Optional: Replace space with underscore if desired, but let's allow spaces for display niceness
        // trimmed = trimmed.replace(/\s+/g, '_'); 

        if (!trimmed) return;

        // Check duplicate
        if (this.tags.some(t => t.name.toLowerCase() === trimmed)) {
            return;
        }

        // Add simplified tag object (id optional for new)
        this.tags.push({ name: trimmed, tag_type: type });
        this.newTagInput = '';
    }

    onTagTypeChange(newType: string) {
        // Clear all selected concern tags, retaining only skin types
        this.tags = this.tags.filter(t => t.tag_type === 'skin_type');
        this.newTagInput = '';
        this.loadAvailableTags(newType);
    }

    loadAvailableTags(type: string) {
        this.tagService.getTags(type).subscribe({
            next: (tags) => this.availableTags = tags,
            error: (err) => console.error('Failed to load available tags', err)
        });
    }

    removeTag(tag: Tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
        }
    }

    isTagPresent(name: string): boolean {
        return this.tags.some(t => t.name.toLowerCase() === name.toLowerCase());
    }

    toggleSkinType(skinTypeTag: Tag) {
        const index = this.tags.findIndex(t => t.name === skinTypeTag.name && t.tag_type === 'skin_type');
        if (index > -1) {
            this.tags.splice(index, 1);
        } else {
            this.tags.push({ name: skinTypeTag.name, tag_type: 'skin_type' });
        }
    }

    isSkinTypeSelected(name: string): boolean {
        return this.tags.some(t => t.name === name && t.tag_type === 'skin_type');
    }

    formatTagName(name: string): string {
        if (!name) return '';

        const overrides: { [key: string]: string } = {
            'marks_blemishes': 'Marks & Blemishes',
            'pigmentation_discoloration': 'Pigmentation & Discoloration',
            'fine_lines_wrinkles': 'Fine Lines & Wrinkles',
            'under_eye_darkness': 'Under Eye Darkness',
            'dryness_relief': 'Dryness Relief',
            'dandruff_scalp': 'Dandruff & Scalp',
            'oily_flat_dull': 'Oily, Flat & Dull'
        };

        if (overrides[name]) {
            return overrides[name];
        }

        return name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    saveTags() {
        const payload = { tags: this.tags.map(t => ({ name: t.name, tag_type: t.tag_type })) };
        this.tagService.replaceProductTags(this.productId, payload).subscribe({
            next: (updatedTags) => {
                this.tags = updatedTags; // Reload from server response to get IDs etc
                this.snackBar.open('Tags Saved Successfully!', 'Close', { duration: 3000 });
            },
            error: (err) => {
                console.error('Save tags failed', err);
                const msg = err.error?.detail || 'Failed to save tags';
                this.snackBar.open(msg, 'Close', { duration: 5000 });
            }
        });
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
            product.images.forEach((img: any) => {
                const url = typeof img === 'string' ? img : img.image_url;
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

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isLoading = true;
            const formData = new FormData();
            formData.append('file', file);

            // Push instant local visual preview immediately
            const objectUrl = URL.createObjectURL(file);
            this.images.push(this.fb.control(objectUrl, Validators.required));

            this.http.post<any[]>(`${environment.apiBaseUrl}/api/products/${this.productId}/images/upload`, formData)
                .subscribe({
                    next: (updatedImages) => {
                        this.images.clear();
                        updatedImages.forEach(img => {
                            const url = typeof img === 'string' ? img : img.image_url;
                            this.images.push(this.fb.control(url, Validators.required));
                        });
                        this.isLoading = false;
                        this.snackBar.open('Image Uploaded', 'Close', { duration: 3000 });
                        event.target.value = null; // Reset input
                    },
                    error: (err) => {
                        console.error('Upload failed', err);
                        this.isLoading = false;
                        this.snackBar.open('Image Upload Failed', 'Close', { duration: 3000 });
                        // Revert visual preview since backend failed
                        this.images.removeAt(this.images.length - 1);
                        event.target.value = null;
                    }
                });
        }
    }

    getImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('data:image')) {
            return url;
        }
        if (url.startsWith('/uploads/')) {
            return environment.apiBaseUrl + url;
        }
        return url;
    }

    onImgError(event: any) {
        if (!event.target.src.includes('assets/images/placeholder-product.jpg')) {
            event.target.src = 'assets/images/placeholder-product.jpg';
        }
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
            const tagsPayload = { tags: this.tags.map(t => ({ name: t.name, tag_type: t.tag_type })) };
            this.tagService.replaceProductTags(this.productId, tagsPayload).subscribe({
                next: (updatedTags) => {
                    this.tags = updatedTags; // Refresh tags from API
                    this.isLoading = false;
                    this.snackBar.open('Draft & Tags Saved Successfully', 'Close', { duration: 3000 });
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBar.open('Draft Saved but Tags Failed', 'Close', { duration: 3000 });
                }
            });
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
            const tagsPayload = { tags: this.tags.map(t => ({ name: t.name, tag_type: t.tag_type })) };
            this.tagService.replaceProductTags(this.productId, tagsPayload).subscribe({
                next: (updatedTags) => {
                    this.tags = updatedTags; // Refresh tags from API
                    this.isLoading = false;
                    this.snackBar.open('Product Published Live with Tags!', 'Close', { duration: 3000 });
                    this.router.navigate(['/admin/products']);
                },
                error: () => {
                    this.isLoading = false;
                    this.snackBar.open('Product Published, but Tags failed to save.', 'Close', { duration: 4000 });
                    this.router.navigate(['/admin/products']);
                }
            });
        });
    }

    // --- Helpers ---

    preparePayload(): any {
        const formValue = this.productForm.value;

        const cleanUrl = (url: string | null | undefined): string => {
            if (!url) return '';
            // If the frontend mapImageUrl has prepended the full base URL, strip it back to relative
            if (url.startsWith(environment.apiBaseUrl + '/uploads/')) {
                return url.replace(environment.apiBaseUrl, '');
            }
            return url;
        };

        // Convert images, stripping blob previews and normalizing any absolute URLs back to relative
        const images = (formValue.images || [])
            .map((url: string, index: number) => ({
                image_url: cleanUrl(url),
                sort_order: index,
                is_primary: index === 0
            }))
            .filter((img: any) => img.image_url && !img.image_url.startsWith('blob:'));

        return {
            ...formValue,
            images: images
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
