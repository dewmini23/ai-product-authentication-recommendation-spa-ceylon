import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';

@Component({
    selector: 'app-quick-view-modal',
    template: `
    <div class="modal-overlay" *ngIf="product" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close()">×</button>
        
        <div class="modal-body">
          <div class="image-side">
             <div class="skeleton-img" *ngIf="!product.imageUrl"></div>
             <img *ngIf="product.imageUrl" [src]="product.imageUrl" [alt]="product.name">
          </div>
          
          <div class="details-side">
            <span class="category">{{ product.category }}</span>
            <h2>{{ product.name }}</h2>
            
            <div class="rating">
               <span *ngFor="let star of [1,2,3,4,5]; let i = index" [class.filled]="i < product.rating">★</span>
               <span class="count">(124 reviews)</span>
            </div>

            <div class="price">LKR {{ product.price | number }}</div>
            
            <p class="desc">{{ product.description || 'Experience the luxury of pure Ceylon ingredients using age-old Ayurveda wisdom directly on your skin.' }}</p>

            <div class="trust-badges">
                <span>🌿 100% Natural</span>
                <span>🐰 Cruelty Free</span>
            </div>

            <div class="actions">
               <button class="btn-primary" (click)="onAddToCart()">Add to Cart</button>
               <button class="btn-auth" (click)="onAuthenticate()">Authenticate Product</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(5px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: #0a1f1b; /* Deep green bg */
      width: 90%;
      max-width: 800px;
      border: 1px solid rgba(200, 162, 74, 0.3);
      border-radius: 8px;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease-out;
      overflow: hidden;
    }

    .close-btn {
      position: absolute;
      top: 15px;
      right: 20px;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      z-index: 10;
      line-height: 1;
      
      &:hover {
        color: #C8A24A;
      }
    }

    .modal-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      
      @media(max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .image-side {
      height: 400px;
      position: relative;
      background: #000;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .skeleton-img {
         width: 100%;
         height: 100%;
         background: #111;
      }
    }

    .details-side {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .category {
        color: #C8A24A;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
    }

    h2 {
        color: #fff;
        font-family: 'Playfair Display', serif; /* Or fallback */
        margin: 0 0 1rem 0;
        font-size: 2rem;
    }

    .rating {
        color: #444;
        margin-bottom: 1rem;
        .filled { color: #C8A24A; }
        .count { color: #888; font-size: 0.8rem; margin-left: 8px; }
    }

    .price {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 300;
        margin-bottom: 1.5rem;
    }

    .desc {
        color: #ccc;
        line-height: 1.6;
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
    }

    .trust-badges {
        display: flex;
        gap: 15px;
        margin-bottom: 2rem;
        color: #fff;
        font-size: 0.85rem;
    }

    .actions {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;

        button {
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            flex: 1;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #C8A24A;
            border: none;
            color: #000;
            &:hover { background: #dcb35b; }
        }

        .btn-auth {
            background: transparent;
            border: 1px solid #C8A24A;
            color: #C8A24A;
            &:hover { background: rgba(200, 162, 74, 0.1); }
        }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class QuickViewModalComponent {
    @Input() product: Product | null = null;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() addToCart = new EventEmitter<Product>();
    @Output() authenticate = new EventEmitter<Product>();

    close() {
        this.closeEvent.emit();
    }

    onAddToCart() {
        if (this.product) this.addToCart.emit(this.product);
    }

    onAuthenticate() {
        if (this.product) this.authenticate.emit(this.product);
    }
}
