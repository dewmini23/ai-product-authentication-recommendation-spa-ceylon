import { Component, OnInit } from '@angular/core';

interface Review {
    id: number;
    name: string;
    quote: string;
    rating: number; // 1-5
    productRoute: string;
    bgVariant: string; // CSS class modifier for gradient variation
}

@Component({
    selector: 'app-reviews-section',
    templateUrl: './reviews-section.component.html',
    styleUrls: ['./reviews-section.component.scss']
})
export class ReviewsSectionComponent implements OnInit {

    reviews: Review[] = [
        {
            id: 1,
            name: 'Hasani Lelwala',
            quote: 'Absolutely in love with the calming scent. It transforms my evening routine.',
            rating: 5,
            productRoute: '/product/201',
            bgVariant: 'variant-1'
        },
        {
            id: 2,
            name: 'Dilshan Perera',
            quote: 'The texture is divine and absorbs so quickly. My skin has never felt better.',
            rating: 5,
            productRoute: '/product/202',
            bgVariant: 'variant-2'
        },
        {
            id: 3,
            name: 'Sarah Jenkins',
            quote: 'A true luxury experience. The packaging, the smell, the results—perfection.',
            rating: 5,
            productRoute: '/product/206',
            bgVariant: 'variant-3'
        }
    ];

    constructor() { }

    ngOnInit(): void {
    }

}
