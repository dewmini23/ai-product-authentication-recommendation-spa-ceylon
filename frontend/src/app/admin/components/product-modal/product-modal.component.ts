import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AdminProduct } from '../../models/admin-product.model';
import { ProductAdminService } from '../../services/product-admin.service';

@Component({
    selector: 'app-product-modal',
    templateUrl: './product-modal.component.html',
    styleUrls: ['./product-modal.component.scss']
})
export class ProductModalComponent {
    @Input() isOpen = false;
    @Input() product: AdminProduct | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<AdminProduct>();

    // Draft Form Model
    formData: Partial<AdminProduct> = this.getEmptyDraft();
    isLoading = false;

    // Dropdown Options
    categories = [
        { id: 1, name: 'Skin' },
        { id: 2, name: 'Hair' },
        { id: 3, name: 'Body' },
        { id: 4, name: 'Fragrances' },
        { id: 5, name: 'Wellness' },
        { id: 6, name: 'Gifts' }
    ];

    constructor(
        private productService: ProductAdminService,
        private router: Router
    ) { }

    ngOnChanges() {
        if (this.isOpen) {
            if (this.product) {
                this.formData = { ...this.product };
            } else {
                this.formData = this.getEmptyDraft();
            }
        }
    }

    getEmptyDraft(): Partial<AdminProduct> {
        return {
            id: 0,
            name: '',
            category_id: 1,
            price_lkr: 0,
            stock_qty: 0,
            short_description: '',
            is_new_arrival: false,
            images: [],
            ingredient_highlights: []
        };
    }

    isFormValid(): boolean {
        // Minimal Validation
        return !!(
            this.formData.name && this.formData.name.length >= 3 &&
            this.formData.short_description && this.formData.short_description.length >= 10 &&
            this.formData.price_lkr !== undefined && this.formData.price_lkr >= 0 &&
            this.formData.stock_qty !== undefined && this.formData.stock_qty >= 0
        );
    }

    onSave() {
        if (!this.isFormValid()) return;

        this.isLoading = true;

        // If we are just creating a draft (ProductModal is mainly for creation now based on new flow)
        // If we were editing, we would be in the editor page.
        // But let's handle the case if product is passed (though likely not used for edit anymore)

        if (this.product && this.product.id) {
            // If for some reason we edit here, just emit save. But goal is create -> navigate.
            this.save.emit(this.formData as AdminProduct);
            this.closeModal();
            return;
        }

        // Create Draft Flow
        this.productService.createDraft(this.formData).subscribe({
            next: (newProduct: any) => {
                this.isLoading = false;
                this.closeModal();
                // Navigate to Editor
                this.router.navigate(['/admin/products', newProduct.id, 'edit']);
            },
            error: (err: any) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    closeModal() {
        this.close.emit();
    }
}

