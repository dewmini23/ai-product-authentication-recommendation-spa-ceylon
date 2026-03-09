import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    isMenuOpen: boolean = false;
    isSearchOpen: boolean = false;
    isAccountOpen: boolean = false;

    // Track active dropdown in mobile view
    activeMobileDropdown: string | null = null;

    menuItems = [
        { label: 'Home', link: '/', type: 'link' },
        { label: 'Authenticate', link: '/authenticate', type: 'link', highlight: true },
        { label: 'Recommendations', link: '/recommendations', type: 'link', highlight: true },
        { label: 'Festive', link: '/festive', type: 'link' },
        { label: 'Promotions', link: '/promotions', type: 'link' },
        { label: 'For Men', link: '/men', type: 'link' },
        {
            label: 'Shop All', type: 'dropdown',
            children: ['New Arrivals', 'Best Sellers', 'Gift Sets', 'Travel Essentials']
        },
        {
            label: 'Skin', type: 'dropdown',
            children: ['Cleansers', 'Toners', 'Serums', 'Moisturizers', 'Masks']
        },
        {
            label: 'Mind & Body', type: 'dropdown',
            children: ['Bath & Shower', 'Body Care', 'Hand Care', 'Foot Care', 'De-Stress']
        },
        {
            label: 'Hair', type: 'dropdown',
            children: ['Shampoos', 'Conditioners', 'Treatments', 'Styling']
        },
        {
            label: 'Home', type: 'dropdown',
            children: ['Candles', 'Diffusers', 'Room Sprays', 'Incense']
        },
        {
            label: 'Fragrances', type: 'dropdown',
            children: ['Eau de Parfum', 'Body Mist', 'Solid Perfume']
        },
        {
            label: 'Gifting', type: 'dropdown',
            children: ['For Her', 'For Him', 'Corporate', 'Weddings']
        },
        {
            label: 'More', type: 'dropdown',
            children: ['About Us', 'Blog', 'Store Locator', 'Contact']
        }
    ];

    constructor(
        private authService: AuthService,
        private eRef: ElementRef
    ) { }

    ngOnInit(): void {
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.isAccountOpen = false;
        }
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleSearch() {
        this.isSearchOpen = !this.isSearchOpen;
    }

    toggleMobileDropdown(label: string) {
        if (this.activeMobileDropdown === label) {
            this.activeMobileDropdown = null;
        } else {
            this.activeMobileDropdown = label;
        }
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    getUserName(): string {
        return this.authService.getFullName() || 'My Account';
    }

    getUserRole(): string {
        return this.authService.getRole() || '';
    }

    toggleAccountDropdown() {
        this.isAccountOpen = !this.isAccountOpen;
    }

    closeAccountDropdown() {
        this.isAccountOpen = false;
    }

    logout() {
        this.closeAccountDropdown();
        this.authService.logout();
    }
}
