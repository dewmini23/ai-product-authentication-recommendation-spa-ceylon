export interface Product {
    id: number;
    name: string;

    // Existing frontend fields
    category?: string;
    price?: number;
    imageUrl?: string;

    // Backend fields
    price_lkr?: number;
    primary_image_url?: string | null;
    review_count?: number;
    category_id?: number;

    // Common/Shared
    rating: number; // Both use this
    isVerified?: boolean; // Frontend specific mock
    description?: string;
    isAwardWinner?: boolean;
    awardTitle?: string;
}
