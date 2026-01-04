import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  template: `
    <div class="product-card">
      <div class="image-container">
        <!-- Placeholder for image, using skeleton-like bg if no url -->
        <div class="skeleton-img" *ngIf="!product.imageUrl && !product.primary_image_url"></div>
        <img *ngIf="product.imageUrl || product.primary_image_url" [src]="product.primary_image_url || product.imageUrl" [alt]="product.name" loading="lazy">
        
        <!-- Award Badge (New) -->
        <span class="award-tag" *ngIf="product.isAwardWinner">
            <i class="trophy-icon">🏆</i> Award Winner
        </span>

        <span class="verified-tag" *ngIf="product.isVerified">
            <i class="verified-icon">✔</i> Verified Seller
        </span>
      </div>
      <div class="content">
        <div class="category">{{ product.category }}</div>
        <h3 class="name">{{ product.name }}</h3>
        <div class="rating">
           <span *ngFor="let star of [1,2,3,4,5]; let i = index" [class.filled]="i < product.rating">★</span>
        </div>
        <div class="price">LKR {{ (product.price_lkr || product.price) | number }}</div>
        
        <div class="actions">
          <button class="btn-outline" (click)="onQuickView()">Quick View</button>
          <button class="btn-primary" (click)="onAddToCart()">Add to Cart</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Variables (Copied from home.component.scss to avoid importing :host 100vh rule) */
    $primary-gold: #C8A24A;
    $primary-gold-dim: #a8822e;
    $bg-dark: #06110E;
    $bg-card: rgba(255, 255, 255, 0.03);
    $text-light: #f4f4f4;
    $text-muted: #b0b0b0;

    :host {
        display: block;
        height: auto;
        min-height: 0;
    }
    
    /* Standalone styles */
    
    .product-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(200, 162, 74, 0.1);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      /* height: 100%; removed to prevent stretching */
      position: relative;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        border-color: rgba(200, 162, 74, 0.4);

        .image-container img {
          transform: scale(1.05);
        }
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 260px; /* Desktop Fixed Height */
      background: #0a1f1b;
      overflow: hidden;

      @media (max-width: 480px) {
          height: auto;
          aspect-ratio: 1 / 1;
      }


      .skeleton-img, img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      
      .skeleton-img {
         background: linear-gradient(110deg, #0a1f1b 8%, #112d27 18%, #0a1f1b 33%);
         background-size: 200% 100%;
         animation: shimmer 1.5s infinite linear;
      }
    }

    /* Award Badge Style */
    .award-tag {
        position: absolute;
        top: 10px;
        left: 10px; /* Top Left position */
        background: linear-gradient(135deg, #C8A24A 0%, #a8822e 100%); /* Gold Gradient */
        color: #000; /* Black text for contrast */
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 4px; /* Slightly sharper than pill */
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        z-index: 2;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        
        .trophy-icon {
            font-style: normal;
            font-size: 0.9rem;
        }
    }

    .verified-tag {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(6, 17, 14, 0.85);
      color: #C8A24A;
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 20px;
      border: 1px solid #C8A24A;
      display: flex;
      align-items: center;
      gap: 4px;
      backdrop-filter: blur(4px);
    }

    .content {
      padding: 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .category {
      color: #888;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .name {
      color: #f0f0f0;
      font-size: 1rem;
      margin: 0 0 8px 0;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rating {
      color: #444; /* Empty star color */
      font-size: 0.9rem;
      margin-bottom: 8px;
      
      .filled {
        color: #C8A24A;
      }
    }

    .price {
      color: #C8A24A;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 12px;
    }

    .actions {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;

      @media (max-width: 480px) {
          grid-template-columns: 1fr; /* Stack buttons vertically */
      }

      button {
        cursor: pointer;
        font-size: 0.8rem;
        padding: 8px;
        border-radius: 4px;
        transition: all 0.2s;
        font-family: inherit;
      }

      .btn-outline {
        background: transparent;
        border: 1px solid #C8A24A;
        color: #C8A24A;
        &:hover {
          background: rgba(200, 162, 74, 0.1);
        }
      }

      .btn-primary {
        background: linear-gradient(135deg, #C8A24A 0%, #a8822e 100%);
        border: none;
        color: #000;
        font-weight: 600;
        &:hover {
          filter: brightness(1.1);
        }
      }
    }

    @keyframes shimmer {
      to {
        background-position-x: -200%;
      }
    }

  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() quickView = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();

  onQuickView() {
    this.quickView.emit(this.product);
  }

  onAddToCart() {
    this.addToCart.emit(this.product);
  }
}
