export interface IngredientHighlight {
    name: string;
    description: string;
}

export interface ProductImageCreate {
    image_url: string;
    sort_order: number;
    is_primary: boolean;
}

export interface ProductCreateRequest {
    name: string;
    short_description?: string;
    description?: string;
    ingredients?: string;
    how_to_use?: string;
    price_lkr: number;
    rating?: number;
    review_count?: number;
    stock_qty?: number;
    category_id: number;
    is_trending?: boolean;
    is_new_arrival?: boolean;
    is_award_winner?: boolean;
    is_festive?: boolean;
    for_men?: boolean;
    ingredient_highlights?: IngredientHighlight[];
    images?: ProductImageCreate[];
}

export interface ProductResponse {
    id: number;
    name: string;
    short_description?: string;
    description?: string;
    ingredients?: string;
    how_to_use?: string;
    price_lkr: number;
    rating: number;
    review_count: number;
    stock_qty: number;
    category_id: number;
    is_trending: boolean;
    is_new_arrival: boolean;
    is_award_winner: boolean;
    is_festive: boolean;
    for_men: boolean;
    ingredient_highlights?: IngredientHighlight[];
    images: any[];
    primary_image_url?: string;
    created_at: string;
    updated_at: string;
}
