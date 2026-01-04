import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductAdminService } from '../../services/product-admin.service';
import { AdminCategoryService } from '../../services/admin-category.service';
import { AdminProduct } from '../../models/admin-product.model';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-product-management',
    templateUrl: './product-management.component.html',
    styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent implements OnInit, OnDestroy {

    products: any[] = [];
    filteredProducts: any[] = [];
    searchCtrl = new FormControl('');
    private destroy$ = new Subject<void>();

    // Stats
    totalProducts = 0;
    trendingCount = 0;
    newArrivalsCount = 0;
    outOfStockCount = 0;

    // Filters
    selectedCategory = 'All';
    showTrendingOnly = false;
    categories: { id: number; name: string }[] = [];

    // Modal
    isModalOpen = false;
    editingProduct: AdminProduct | null = null;

    isLoading = true;

    constructor(
        private productService: ProductAdminService,
        private categoryService: AdminCategoryService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadCategories();
        this.loadProducts();
        this.setupSearch();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    setupSearch() {
        // Debounced search
        this.searchCtrl.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.applyFilters();
            });
    }

    onSearchEnter() {
        // Immediate search on Enter
        this.applyFilters();
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe((cats: any) => {
            this.categories = cats;
            console.log('✅ Loaded categories:', cats.length, cats);
        });
    }

    loadProducts() {
        this.productService.getProducts().subscribe((data: any) => {
            this.products = data;
            this.isLoading = false;
            this.calculateStats();
            this.applyFilters();
        });
    }

    calculateStats() {
        this.totalProducts = this.products.length;
        this.trendingCount = this.products.filter(p => p.is_trending).length;
        this.newArrivalsCount = this.products.filter(p => p.is_new_arrival).length;
        this.outOfStockCount = this.products.filter(p => p.stock_qty === 0).length;
    }

    applyFilters() {
        let temp = [...this.products];

        // Search filter
        const searchTerm = this.searchCtrl.value?.trim().toLowerCase();
        if (searchTerm) {
            temp = temp.filter(p =>
                p.name?.toLowerCase().includes(searchTerm) ||
                p.short_description?.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (this.selectedCategory !== 'All') {
            const selectedCat = this.categories.find(c => c.name === this.selectedCategory);
            if (selectedCat) {
                temp = temp.filter(p => p.category_id === selectedCat.id);
            }
        }

        // Trending filter
        if (this.showTrendingOnly) {
            temp = temp.filter(p => p.is_trending);
        }

        this.filteredProducts = temp;
    }

    // Modal Actions
    openAddModal() {
        this.editingProduct = null;
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.editingProduct = null;
        // Optionally reload if we stayed on page, but we usually navigate away on create.
        // If we just cancelled, no reload needed.
    }

    saveProduct(product: AdminProduct) {
        // Legacy: The modal now handles creation and navigation directly.
        // This is kept only if we ever re-enable edit-in-modal.
        if (product.id === 0) {
            this.productService.createProduct(product as any).subscribe(() => {
                this.loadProducts();
            });
        }
    }

    deleteProduct(id: number) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.productService.deleteProduct(id).subscribe(() => {
                this.loadProducts();
            });
        }
    }

    // Toggle Actions from Card
    toggleTrending(product: AdminProduct) {
        const updated = { ...product, is_trending: !product.is_trending };
        this.productService.updateProduct(product.id, updated as any).subscribe(() => {
            this.loadProducts();
        });
    }

    getCategoryName(categoryId: number): string {
        const cat = this.categories.find(c => c.id === categoryId);
        return cat ? cat.name : 'Unknown';
    }

    exportCsv() {
        // Check if there are products to export
        if (this.filteredProducts.length === 0) {
            this.snackBar.open('No products to export', 'Close', { duration: 3000 });
            return;
        }

        // CSV Header
        const headers = [
            'id', 'name', 'category_id', 'price_lkr', 'stock_qty', 'rating',
            'review_count', 'is_trending', 'is_new_arrival', 'is_award_winner',
            'is_festive', 'for_men', 'created_at', 'updated_at'
        ];

        // Helper to escape CSV values
        const escapeCsv = (value: any): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}`;
            }
            return str;
        };

        // Build CSV rows
        const rows = this.filteredProducts.map(p => [
            p.id,
            escapeCsv(p.name),
            p.category_id,
            p.price_lkr,
            p.stock_qty,
            p.rating || 0,
            p.review_count || 0,
            p.is_trending ? 'true' : 'false',
            p.is_new_arrival ? 'true' : 'false',
            p.is_award_winner ? 'true' : 'false',
            p.is_festive ? 'true' : 'false',
            p.for_men ? 'true' : 'false',
            escapeCsv(p.created_at),
            escapeCsv(p.updated_at)
        ].join(','));

        // Combine header + rows
        const csv = [headers.join(','), ...rows].join('\n');

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.href = url;
        link.download = `products_export_${date}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        this.snackBar.open(`Exported ${this.filteredProducts.length} products`, 'Close', { duration: 3000 });
    }
}
