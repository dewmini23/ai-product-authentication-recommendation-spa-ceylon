import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelect } from '@angular/material/select';
import { ProductAdminService } from '../../services/product-admin.service';
import { AdminProduct } from '../../models/admin-product.model';
import { ProductCreateRequest } from '../../models/product-api.model';
import { AdminCategoryService } from '../../services/admin-category.service';
import { TagService, Tag } from '../../services/tag.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-admin-product-create',
    templateUrl: './admin-product-create.component.html',
    styleUrls: ['./admin-product-create.component.scss']
})
export class AdminProductCreateComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('categorySelect') categorySelect!: MatSelect;

    productForm!: FormGroup;
    isLoading = false;
    formSubmitted = false;
    categories$: Observable<{ id: number, name: string }[]>;

    pendingUploads: File[] = [];

    private scrollListener?: () => void;

    categories: { id: number, name: string }[] = [];

    selectedCategoryName: string | null = null;

    // Checklist State
    checklist = {
        description: false,
        images: false
    };

    // Tags State
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

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private productService: ProductAdminService,
        private snackBar: MatSnackBar,
        private categoryService: AdminCategoryService,
        private tagService: TagService,
        private http: HttpClient
    ) {
        this.categories$ = this.categoryService.getCategories();
    }

    ngOnInit(): void {
        this.initForm();
        this.setupChecklistListener();

        // Load categories from service
        this.categories$.subscribe(cats => {
            this.categories = cats;
        });

        this.loadSkinTypes();
        this.loadAvailableTags(this.newTagTypeInput);

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

    // --- Tags Methods ---

    addTag(name: string, type: any = this.newTagTypeInput) {
        let trimmed = name?.trim().toLowerCase();
        if (!trimmed) return;

        // Check duplicate
        if (this.tags.some(t => t.name.toLowerCase() === trimmed)) {
            return;
        }

        // Add simplified tag object
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

    loadSkinTypes() {
        this.tagService.getTags('skin_type').subscribe({
            next: (tags) => this.availableSkinTypes = tags,
            error: (err) => console.error('Failed to load skin types', err)
        });
    }

    removeTag(tag: Tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
        }
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
            // Count both already-uploaded URLs and pending file uploads
            const nonBlobImages = (val.images || []).filter((u: string) => u && !u.startsWith('blob:')).length;
            this.checklist.images = (nonBlobImages + this.pendingUploads.length) > 0;
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

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Keep track of the raw file to upload later
                this.pendingUploads.push(file);

                // Purely visual preview - NOT base64
                const objectUrl = URL.createObjectURL(file);
                this.images.push(this.fb.control(objectUrl, Validators.required));
            }

            // Clear input
            event.target.value = null;
        }
    }

    removeImage(index: number) {
        const urlAtIndex = this.images.at(index)?.value;
        if (urlAtIndex && urlAtIndex.startsWith('blob:')) {
            // Count how many blob: urls appear before this index to find the pendingUploads index
            let blobCount = 0;
            for (let i = 0; i < index; i++) {
                if (this.images.at(i)?.value?.startsWith('blob:')) blobCount++;
            }
            if (blobCount < this.pendingUploads.length) {
                URL.revokeObjectURL(urlAtIndex); // Free memory
                this.pendingUploads.splice(blobCount, 1);
            }
        }
        this.images.removeAt(index);
    }


    onImgError(event: any) {
        if (!event.target.src.includes('assets/images/placeholder-product.jpg')) {
            event.target.src = 'assets/images/placeholder-product.jpg';
        }
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
            next: (response: any) => {
                console.log('✅ Product Created:', response);
                const newProductId = response.id; // Extract newly created product ID

                // Next: Handle sequential uploads
                if (this.pendingUploads.length > 0) {
                    this.uploadPendingFiles(newProductId, () => this.syncTagsAndFinish(newProductId));
                } else {
                    this.syncTagsAndFinish(newProductId);
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                console.error('❌ Error creating product:', error);
                const message = error.error?.detail || error.message || 'Failed to create product';
                this.snackBar.open(`Error: ${message} `, 'Close', { duration: 5000 });
            }
        });
    }

    private uploadPendingFiles(productId: number, callback: () => void) {
        let uploadsCompleted = 0;
        let uploadsFailed = 0;
        const totalUploads = this.pendingUploads.length;

        this.pendingUploads.forEach(file => {
            const formData = new FormData();
            formData.append('file', file);

            this.http.post<any[]>(`${environment.apiBaseUrl}/api/products/${productId}/images/upload`, formData).subscribe({
                next: () => {
                    uploadsCompleted++;
                    if (uploadsCompleted + uploadsFailed === totalUploads) callback();
                },
                error: (err) => {
                    console.error('File upload failed', err);
                    uploadsFailed++;
                    if (uploadsCompleted + uploadsFailed === totalUploads) callback();
                }
            });
        });
    }

    private syncTagsAndFinish(productId: number) {
        if (this.tags.length > 0 && productId) {
            const payload = { tags: this.tags.map(t => ({ name: t.name, tag_type: t.tag_type })) };
            this.tagService.replaceProductTags(productId, payload).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.snackBar.open('Product and Tags Published Live!', 'Close', { duration: 3000 });
                    this.router.navigate(['/admin/products']);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    console.error('❌ Error saving tags:', err);
                    const msg = err.error?.detail || err.message || 'Product created but failed to save tags';
                    this.snackBar.open(`Error: ${msg}. Please edit product to add tags.`, 'Close', { duration: 5000 });
                    this.router.navigate(['/admin/products']);
                }
            });
        } else {
            this.isLoading = false;
            this.snackBar.open('Product Published Live!', 'Close', { duration: 3000 });
            this.router.navigate(['/admin/products']);
        }
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

        // Filter out blobs. ONLY send hardcoded legacy HTTP links to the first create router.
        // Blobs indicate the user is uploading a physical file, which is fired via multipart form in step 2.
        const images = (formValue.images || [])
            .map((url: string, index: number) => ({
                image_url: url?.trim() || '',
                sort_order: index,
                is_primary: index === 0
            }))
            .filter((img: any) => img.image_url.length > 0 && !img.image_url.startsWith('blob:'));

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
