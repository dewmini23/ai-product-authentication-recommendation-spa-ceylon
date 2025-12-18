import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-carousel',
  templateUrl: './product-carousel.component.html',
  styleUrls: ['./product-carousel.component.scss']
})
export class ProductCarouselComponent implements OnInit {
  @Input() title: string = '';
  @Input() products: Product[] = [];
  @Input() filters: string[] = [];
  @Input() viewAllRoute: string = '';

  @Output() quickView = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();

  filteredProducts: Product[] = [];
  selectedFilter: string = 'All';

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  currentPage = 1;
  totalPages = 1;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filteredProducts = this.products;
    this.calculatePagination();
  }

  // Update filtered products when input changes
  ngOnChanges(): void {
    this.filterProducts(this.selectedFilter);
  }

  @HostListener('window:resize')
  onResize() {
    this.calculatePagination();
  }

  filterProducts(category: string) {
    this.selectedFilter = category;
    if (category === 'All') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }

    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollLeft = 0;
      this.calculatePagination();
    }
  }

  scrollLeft() {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  scrollRight() {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  onScroll() {
    if (!this.carouselContainer) return;
    this.calculatePagination();
  }

  calculatePagination() {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;

    setTimeout(() => {
      if (!container) return;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      if (clientWidth === 0) return;

      this.totalPages = Math.max(1, Math.ceil(scrollWidth / clientWidth));
      // Cap current page at total pages
      this.currentPage = Math.min(this.totalPages, Math.max(1, Math.round(scrollLeft / clientWidth) + 1));
    }, 50);
  }

  onQuickView(product: Product) {
    this.quickView.emit(product);
  }

  onAddToCart(product: Product) {
    this.addToCart.emit(product);
  }

  navigateToViewAll() {
    if (this.viewAllRoute) {
      this.router.navigate([this.viewAllRoute]);
    }
  }
}
