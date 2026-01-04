export interface IngredientHighlight {
    name: string;
    description: string;
}

export interface AdminProduct {
    id: number;
    name: string;
    // Strict Payload Keys
    short_description: string;
    description: string;
    ingredients: string;
    how_to_use: string;
    price_lkr: number;
    rating: number;
    review_count: number;
    stock_qty: number;
    category_id: number;

    // Flags
    is_trending: boolean;
    is_new_arrival: boolean;
    is_award_winner: boolean;
    is_festive: boolean;
    for_men: boolean;

    // Complex
    ingredient_highlights: IngredientHighlight[];
    images: string[];

    // UI Helpers (Optional, mapped from backend or computed)
    category?: string; // Mapped from category_id for display if needed
    primary_image_url?: string; // Mapped from images[0]
}
