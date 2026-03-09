import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RecommendationsService, NormalizedRec } from './recommendations.service';
import { ChatMessage } from './chat-panel/chat-panel.component';

@Component({
    selector: 'app-recommendations-page',
    templateUrl: './recommendations-page.component.html',
    styleUrls: ['./recommendations-page.component.scss']
})
export class RecommendationsPageComponent implements OnInit, OnDestroy {
    messages: ChatMessage[] = [];
    isTyping: boolean = false;
    recommendations: NormalizedRec[] = [];

    currentTags: string[] = [];

    constructor(
        private recommendationsService: RecommendationsService,
        private router: Router
    ) { }

    goHome() {
        this.router.navigate(['/']);
    }

    ngOnInit() {
        // Destroy any leftover malicious local storage keys from previous code versions
        localStorage.removeItem('skin_type');

        this.messages.push({
            sender: 'assistant',
            text: 'Hi! Tell me your skin or hair concerns and I’ll find the perfect Spa Ceylon products for you.'
        });
    }

    ngOnDestroy() {
        // No-op
    }

    onSendMessage(text: string) {
        this.messages.push({
            sender: 'user',
            text: text
        });

        this.isTyping = true;

        this.recommendationsService.predictTags(text).subscribe({
            next: (res) => {
                const tags = res.tags || [];
                if (tags.length === 0) {
                    this.isTyping = false;
                    this.messages.push({
                        sender: 'assistant',
                        text: 'I couldn’t confidently detect the concern. Try mentioning acne, dryness, sensitivity, oiliness, hair fall, or stress.'
                    });
                } else {
                    this.processConcernFlow(text, tags);
                }
            },
            error: (err) => {
                console.error('ML API Error:', err);
                this.isTyping = false;
                this.messages.push({
                    sender: 'assistant',
                    text: 'Something went wrong while analyzing that. Try again.'
                });
            }
        });
    }

    private processConcernFlow(text: string, predictedTags: string[]) {
        this.executeFinalRecommendationsCall(predictedTags);
    }

    private executeFinalRecommendationsCall(tags: string[]) {
        console.log('recommendations URL params:', tags);

        this.recommendationsService.getRecommendations(tags, 12).subscribe({
            next: (res) => {
                const items = this.recommendationsService.normalizeRecommendationsResponse(res);
                this.processFinalResults(items, tags);
            },
            error: (err) => {
                console.error('Recommendations API Error:', err);
                this.isTyping = false;
                this.messages.push({
                    sender: 'assistant',
                    text: 'Couldn’t load recommendations right now. Try again.'
                });
            }
        });
    }

    private processFinalResults(items: NormalizedRec[], tags: string[]) {
        this.recommendations = items;
        this.isTyping = false;

        let assistantMsg = 'Got it — I’ll recommend products based on your concern(s).';

        this.messages.push({
            sender: 'assistant',
            text: assistantMsg,
            tags: tags
        });
    }

    selectedProduct: any = null;
    isQuickViewOpen: boolean = false;

    onQuickView(product: any) {
        // Ensure the modal's expected 'imageUrl' property is mapped correctly
        if (!product.imageUrl && product.primary_image_url) {
            product.imageUrl = product.primary_image_url;
        } else if (!product.imageUrl && product.images && product.images.length > 0) {
            product.imageUrl = product.images[0].image_url;
        }

        // Ensure the modal's expected 'price' property is mapped correctly
        if (product.price === undefined && product.price_lkr !== undefined) {
            product.price = product.price_lkr;
        }

        this.selectedProduct = product;
        this.isQuickViewOpen = true;
    }

    closeQuickView() {
        this.isQuickViewOpen = false;
        this.selectedProduct = null;
    }

    onAddToCart(product: any) {
        // Simple notification/console placeholder or using global CartService if available
        console.log('Added to cart:', product.name);
        alert(`${product.name} added to cart!`);
    }
}
