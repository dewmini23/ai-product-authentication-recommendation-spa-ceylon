import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartKey = 'spa_ceylon_cart';
    private cartItems = new BehaviorSubject<Product[]>([]);
    cartCount$ = new BehaviorSubject<number>(0);

    constructor() {
        this.loadCart();
    }

    private loadCart() {
        const saved = localStorage.getItem(this.cartKey);
        if (saved) {
            const items = JSON.parse(saved);
            this.cartItems.next(items);
            this.cartCount$.next(items.length);
        }
    }

    addToCart(product: Product) {
        const current = this.cartItems.value;
        const updated = [...current, product];
        this.cartItems.next(updated);
        this.cartCount$.next(updated.length);
        this.saveCart(updated);
    }

    removeFromCart(productId: number) {
        const current = this.cartItems.value;
        const updated = current.filter(p => p.id !== productId);
        this.cartItems.next(updated);
        this.cartCount$.next(updated.length);
        this.saveCart(updated);
    }

    getCartItems() {
        return this.cartItems.asObservable();
    }

    private saveCart(items: Product[]) {
        localStorage.setItem(this.cartKey, JSON.stringify(items));
    }
}
