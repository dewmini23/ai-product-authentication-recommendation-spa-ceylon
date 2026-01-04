import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    allProducts: Product[] = [];

    newArrivalsProducts: Product[] = [];
    isLoadingNewArrivals = false;
    newArrivalsError: string | null = null;

    awardWinnerProducts: Product[] = [];
    isLoadingAwardWinners = false;
    awardWinnersError: string | null = null;

    filters = ['All', 'Skin', 'Hair', 'Fragrances', 'Body'];

    showQuickView = false;
    selectedProduct: Product | null = null;

    constructor(
        private router: Router,
        private cartService: CartService,
        private productService: ProductService
    ) { }

    ngOnInit(): void {
        this.fetchTrendingProducts();
        this.fetchNewArrivals();
        this.fetchAwardWinners();
    }

    fetchTrendingProducts() {
        this.productService.getTrendingProducts().subscribe({
            next: (data) => {
                this.allProducts = data;
            },
            error: (err) => {
                console.error('Failed to fetch trending products', err);
            }
        });
    }

    fetchNewArrivals() {
        this.isLoadingNewArrivals = true;
        this.newArrivalsError = null;

        this.productService.getNewArrivals(8).subscribe({
            next: (data) => {
                this.newArrivalsProducts = data;
                this.isLoadingNewArrivals = false;
            },
            error: (err) => {
                console.error('Failed to fetch new arrivals', err);
                this.newArrivalsError = 'Unable to load new arrivals. Please try again later.';
                this.newArrivalsProducts = [];
                this.isLoadingNewArrivals = false;
            }
        });
    }

    fetchAwardWinners() {
        this.isLoadingAwardWinners = true;
        this.awardWinnersError = null;

        this.productService.getAwardWinners(8).subscribe({
            next: (data) => {
                this.awardWinnerProducts = data;
                this.isLoadingAwardWinners = false;
            },
            error: (err) => {
                console.error('Failed to fetch award winners', err);
                this.awardWinnersError = 'Unable to load award winners. Please try again later.';
                this.awardWinnerProducts = [];
                this.isLoadingAwardWinners = false;
            }
        });
    }

    openQuickView(product: Product) {
        this.selectedProduct = product;
        this.showQuickView = true;
    }

    closeQuickView() {
        this.showQuickView = false;
        this.selectedProduct = null;
    }

    addToCart(product: Product) {
        this.cartService.addToCart(product);
        console.log('Added to cart:', product.name);
    }

    navigateToAuthenticate(product?: Product) {
        if (product) {
            this.router.navigate(['/authenticate'], { queryParams: { productId: product.id } });
        } else {
            this.router.navigate(['/authenticate']);
        }
    }

    navigateToRecommendations() {
        this.router.navigate(['/recommendations']);
    }

    navigateToShop() {
        this.router.navigate(['/shop']);
    }

    navigateToNewArrivals() {
        this.router.navigate(['/new-arrivals']);
    }
}
