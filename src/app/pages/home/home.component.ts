import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    // Mock Data
    // Mock Data
    allProducts: Product[] = [
        {
            id: 1,
            name: 'Sleep Intense Dream Essence Mist',
            category: 'Fragrances',
            price: 4500,
            rating: 5,
            imageUrl: 'https://spaceylon.com/wp-content/uploads/2023/04/Sleep-Intense-Dream-Essence-Mist-100ml.jpg',
            isVerified: true,
            description: 'A calming mist to promote deep sleep and relaxation. Infused with Neroli and Ylang Ylang.'
        },
        {
            id: 2,
            name: 'Virgin Coconut Day Hydrating Serum',
            category: 'Skin',
            price: 6200,
            rating: 4,
            imageUrl: '',
            isVerified: true,
            description: 'Deeply hydrating serum with pure Virgin Coconut Oil. Protects against moisture loss.'
        },
        {
            id: 3,
            name: 'Cardamom Rose Body Scrub',
            category: 'Body',
            price: 3800,
            rating: 5,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 4,
            name: 'White Jasmine Face Treatment Oil',
            category: 'Skin',
            price: 5500,
            rating: 4.5,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 5,
            name: 'Kesara Hair Cleanser',
            category: 'Hair',
            price: 2900,
            rating: 4,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 6,
            name: 'Peace Hand & Body Lotion',
            category: 'Body',
            price: 3200,
            rating: 5,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 7,
            name: 'Ceylon Tea & Ylang Body Butter',
            category: 'Body',
            price: 4100,
            rating: 4.5,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 8,
            name: 'Sandalwood Spice Home Fragarance',
            category: 'Fragrances',
            price: 7500,
            rating: 5,
            imageUrl: '',
            isVerified: false
        }
    ];

    newArrivalsProducts: Product[] = [
        {
            id: 101,
            name: 'Lemongrass & Mandarin Essential Oil',
            category: 'Fragrances',
            price: 2200,
            rating: 5,
            imageUrl: '',
            isVerified: true,
            description: 'Energizing blend of Lemongrass and Mandarin to uplift your senses.'
        },
        {
            id: 102,
            name: 'Aloe Vera Watergrass Hair Masque',
            category: 'Hair',
            price: 4800,
            rating: 4.8,
            imageUrl: '',
            isVerified: true,
            description: 'Deep conditioning masque for restored shine and strength.'
        },
        {
            id: 103,
            name: 'Neem & Tea Tree Face Wash',
            category: 'Skin',
            price: 2600,
            rating: 4.2,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 104,
            name: 'Royal Lotus Body Milk',
            category: 'Body',
            price: 3500,
            rating: 4.7,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 105,
            name: 'Frankincense Kay Lime Luxury Soap',
            category: 'Body',
            price: 1200,
            rating: 4.5,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 106,
            name: 'Gotukola & Walnut Exfoliator',
            category: 'Skin',
            price: 3900,
            rating: 4.6,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 107,
            name: 'True Turmeric Vitamin C Glow',
            category: 'Skin',
            price: 5800,
            rating: 4.9,
            imageUrl: '',
            isVerified: true
        },
        {
            id: 108,
            name: 'Lavender Neroli Pillow Spray',
            category: 'Fragrances',
            price: 3100,
            rating: 5,
            imageUrl: '',
            isVerified: false
        }
    ];

    awardWinnerProducts: Product[] = [
        {
            id: 201,
            name: 'Sleep Intense Dream Essence Mist',
            category: 'Fragrances',
            price: 4500,
            rating: 5,
            imageUrl: 'https://spaceylon.com/wp-content/uploads/2023/04/Sleep-Intense-Dream-Essence-Mist-100ml.jpg',
            isVerified: true,
            isAwardWinner: true,
            awardTitle: 'Best Sleep Mist 2024'
        },
        {
            id: 202,
            name: 'Virgin Coconut Day Hydrating Serum',
            category: 'Skin',
            price: 6200,
            rating: 5,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true,
            awardTitle: 'Innovation Award'
        },
        {
            id: 203,
            name: 'Cardamom Rose Body Scrub',
            category: 'Body',
            price: 3800,
            rating: 5,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        },
        {
            id: 204,
            name: 'Kesara Hair Cleanser',
            category: 'Hair',
            price: 2900,
            rating: 4.5,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        },
        {
            id: 205,
            name: 'Ceylon Tea & Ylang Body Butter',
            category: 'Body',
            price: 4100,
            rating: 4.8,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        },
        {
            id: 206,
            name: 'White Jasmine Face Treatment Oil',
            category: 'Skin',
            price: 5500,
            rating: 5,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        },
        {
            id: 207,
            name: 'Sandalwood Spice Home Fragarance',
            category: 'Fragrances',
            price: 7500,
            rating: 4.9,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        },
        {
            id: 208,
            name: 'Peace Hand & Body Lotion',
            category: 'Body',
            price: 3200,
            rating: 5,
            imageUrl: '',
            isVerified: true,
            isAwardWinner: true
        }
    ];

    filters = ['All', 'Skin', 'Hair', 'Fragrances', 'Body'];

    showQuickView = false;
    selectedProduct: Product | null = null;

    constructor(
        private router: Router,
        private cartService: CartService
    ) { }

    ngOnInit(): void {
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
