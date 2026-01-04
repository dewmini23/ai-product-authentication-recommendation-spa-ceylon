import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;

  selectedImageIndex = 0;
  showCompleteIngredients = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(+id);
    } else {
      this.error = 'Invalid product ID';
      this.isLoading = false;
    }
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = 'Failed to load product';
        this.isLoading = false;
      }
    });
  }

  getImages(): string[] {
    if (!this.product) return [];

    const images = (this.product as any).images;
    if (images && Array.isArray(images) && images.length > 0) {
      return images.map((img: any) => img.image_url || img);
    }

    const primaryImage = (this.product as any).primary_image_url || this.product.imageUrl;
    return primaryImage ? [primaryImage] : [];
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  getPrice(): number {
    if (!this.product) return 0;
    return (this.product as any).price_lkr || this.product.price || 0;
  }

  getKeyIngredients(): string[] {
    if (!this.product) return [];

    const highlights = (this.product as any).ingredient_highlights;
    if (highlights && Array.isArray(highlights)) {
      return highlights.slice(0, 5).map((h: any) => h.name).filter((n: string) => n);
    }

    const ingredients = (this.product as any).ingredients;
    if (ingredients && typeof ingredients === 'string') {
      return ingredients.split(',').map(i => i.trim()).filter(i => i).slice(0, 5);
    }

    return [];
  }

  getIngredientHighlights(): Array<{ name: string, description: string }> {
    if (!this.product) return [];

    const highlights = (this.product as any).ingredient_highlights;
    if (highlights && Array.isArray(highlights)) {
      return highlights.filter((h: any) => h.name && h.description).slice(0, 6);
    }

    return [];
  }

  getCompleteIngredients(): string {
    if (!this.product) return '';

    const ingredients = (this.product as any).ingredients;
    if (ingredients && typeof ingredients === 'string') {
      return ingredients;
    }

    return '';
  }

  getShortDescription(): string {
    if (!this.product) return '';
    return (this.product as any).short_description || '';
  }

  getFullDescription(): string {
    if (!this.product) return '';
    return this.product.description || '';
  }

  getHowToUse(): string {
    if (!this.product) return '';
    return (this.product as any).how_to_use || '';
  }

  onAddToCart(): void {
    console.log('Add to cart:', this.product);
  }

  onAuthenticate(): void {
    console.log('Authenticate product:', this.product);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  hasStockInfo(): boolean {
    return !!(this.product && (this.product as any).stock_qty !== undefined);
  }

  getStockQty(): number {
    return this.product ? (this.product as any).stock_qty || 0 : 0;
  }

  isAwardWinner(): boolean {
    return !!(this.product?.isAwardWinner);
  }

  getIngredientEmoji(ingredientName: string): string {
    const name = ingredientName.toLowerCase();

    // Use consistent luxury icons: leaf 🌿, droplet 💧, flask ⚗️
    if (name.includes('frankincense') || name.includes('resin')) return '💧';
    if (name.includes('rice') || name.includes('grain') || name.includes('bran')) return '🌾';
    if (name.includes('lime') || name.includes('citrus') || name.includes('lemon') || name.includes('kay')) return '🍋';
    if (name.includes('tea') || name.includes('botanical') || name.includes('herb')) return '🌿';
    if (name.includes('coconut') || name.includes('oil')) return '💧';
    if (name.includes('aloe') || name.includes('vera')) return '🌿';
    if (name.includes('extract') || name.includes('essence')) return '⚗️';

    return '🌿'; // Default: leaf
  }

  toggleCompleteIngredients(): void {
    this.showCompleteIngredients = !this.showCompleteIngredients;
  }
}
