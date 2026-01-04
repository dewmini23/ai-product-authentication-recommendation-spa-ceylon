from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .product_image import ProductImage, ProductImageCreate

class IngredientHighlight(BaseModel):
    name: str
    description: str

class ProductBase(BaseModel):
    name: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    price_lkr: float
    rating: float = 0.0
    review_count: int = 0
    stock_qty: int = 0
    category_id: int
    is_trending: bool = False
    is_new_arrival: bool = False
    is_award_winner: bool = False
    is_festive: bool = False
    for_men: bool = False
    ingredient_highlights: Optional[List[IngredientHighlight]] = None

class ProductCreate(ProductBase):
    images: Optional[List[ProductImageCreate]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    price_lkr: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    stock_qty: Optional[int] = None
    category_id: Optional[int] = None
    is_trending: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_award_winner: Optional[bool] = None
    is_festive: Optional[bool] = None
    for_men: Optional[bool] = None
    ingredient_highlights: Optional[List[IngredientHighlight]] = None

class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    images: List[ProductImage] = []
    primary_image_url: Optional[str] = None
    ingredient_highlights: Optional[List[IngredientHighlight]] = None

    class Config:
        from_attributes = True
