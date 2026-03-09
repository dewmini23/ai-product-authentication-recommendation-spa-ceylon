import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NormalizedRec } from '../recommendations.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-products-grid',
    templateUrl: './products-grid.component.html',
    styleUrls: ['./products-grid.component.scss']
})
export class ProductsGridComponent implements OnChanges {
    @Input() products: NormalizedRec[] = [];
    @Output() quickView = new EventEmitter<any>();
    @Output() addToCart = new EventEmitter<any>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['products'] && this.products) {
            this.products.forEach(item => {
                if (item.product) {
                    let url = item.product.primary_image_url;
                    if (!url && item.product.images && item.product.images.length > 0) {
                        url = item.product.images[0].image_url;
                    }
                    if (url && url.startsWith('/uploads/')) {
                        item.product.primary_image_url = `${environment.apiBaseUrl}${url}`;
                    } else if (url && !item.product.primary_image_url) {
                        item.product.primary_image_url = url;
                    }
                }
            });
        }
    }

    formatTag(tag: string): string {
        if (!tag) return '';
        return tag.replace(/_/g, ' ');
    }
}
