import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
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
            
            <p class="desc">{{ getShortDescription() }}</p>

            <div class="key-ingredients" *ngIf="getKeyIngredients().length > 0">
                <h4>Key Ingredients</h4>
                <div class="ingredient-chips">
                    <span class="chip" *ngFor="let ingredient of getKeyIngredients()">{{ ingredient }}</span>
                </div>
            </div>

            <div class="trust-badges">
                <span>🌿 100% Natural</span>
                <span>🐰 Cruelty Free</span>
            </div>

            <div class="actions">
               <button class="btn-primary" (click)="onAddToCart()">Add to Cart</button>
               <button class="btn-secondary" (click)="viewFullDetails()">View Full Details</button>
               <button class="btn-auth" (click)="onAuthenticate()">Authenticate</button>
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
      padding: 20px;
    }

    .modal-content {
      background: #0a1f1b;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      border: 1px solid rgba(200, 162, 74, 0.3);
      border-radius: 8px;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease-out;
      overflow: hidden;
      display: flex;
      flex-direction: column;
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
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      
      @media(max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .image-side {
      max-height: none;
      height: 100%;
      position: relative;
      background: #000;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
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
        font-family: 'Playfair Display', serif;
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

    .key-ingredients {
        margin-bottom: 1.5rem;
        
        h4 {
            color: #C8A24A;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 0.75rem 0;
            font-weight: 600;
        }
        
        .ingredient-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            
            .chip {
                background: rgba(200, 162, 74, 0.1);
                border: 1px solid rgba(200, 162, 74, 0.3);
                color: #C8A24A;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.8rem;
                white-space: nowrap;
            }
        }
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
        gap: 12px;
        flex-wrap: wrap;

        button {
            padding: 10px 18px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            flex: 1;
            transition: all 0.2s;
            white-space: nowrap;
            min-width: fit-content;
        }

        .btn-primary {
            background: #C8A24A;
            border: none;
            color: #000;
            &:hover { background: #dcb35b; }
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid #fff;
            color: #fff;
            &:hover { background: rgba(255, 255, 255, 0.1); }
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

  constructor(private router: Router) { }

  close() {
    this.closeEvent.emit();
  }

  onAddToCart() {
    if (this.product) this.addToCart.emit(this.product);
  }

  onAuthenticate() {
    if (this.product) this.authenticate.emit(this.product);
  }

  viewFullDetails() {
    if (this.product) {
      this.close();
      this.router.navigate(['/products', this.product.id]);
    }
  }

  getShortDescription(): string {
    if (!this.product) return '';
    const shortDesc = (this.product as any).short_description;
    if (shortDesc && typeof shortDesc === 'string' && shortDesc.trim()) {
      return shortDesc;
    }
    const desc = this.product.description || 'Experience the luxury of pure Ceylon ingredients using age-old Ayurveda wisdom directly on your skin.';
    if (desc.length <= 150) return desc;
    const truncated = desc.substring(0, 150);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  getKeyIngredients(): string[] {
    if (!this.product) return [];

    // Try ingredient_highlights first (if exists in future)
    const highlights = (this.product as any).ingredient_highlights;
    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      return highlights.slice(0, 5).map((h: any) => h.name).filter((n: string) => n);
    }

    // Fallback to ingredients string (comma-separated)
    const ingredients = (this.product as any).ingredients;
    if (ingredients && typeof ingredients === 'string') {
      return ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0)
        .slice(0, 5);
    }

    return [];
  }
}
