from sqlalchemy.orm import Session, subqueryload
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any
from app.models import Product as ProductModel


class ProductService:
    """Service layer for product business logic."""
    
    @staticmethod
    def list_products(
        db: Session,
        filters: Dict[str, Any],
        page: int = 1,
        limit: int = 20,
        sort: str = "latest"
    ) -> List[ProductModel]:
        """
        List products with filtering, sorting, and pagination.
        
        Args:
            db: Database session
            filters: Dictionary of filter parameters
            page: Page number (1-indexed)
            limit: Items per page
            sort: Sort order (latest, price_asc, price_desc, rating_desc)
            
        Returns:
            List of Product objects with primary_image_url set
        """
        query = db.query(ProductModel)
        
        # Apply filters
        query = ProductService._apply_filters(query, filters)
        
        # Apply sorting
        query = ProductService._apply_sorting(query, sort)
        
        # Eager load images to avoid N+1 and ensure data is available
        query = query.options(subqueryload(ProductModel.images))
        
        # Pagination
        skip = (page - 1) * limit
        products = query.offset(skip).limit(limit).all()
        
        # Populate primary_image_url for each product
        for product in products:
            ProductService._set_primary_image(product)
        
        return products
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[ProductModel]:
        """
        Get a single product by ID.
        
        Args:
            db: Database session
            product_id: Product ID
            
        Returns:
            Product object with primary_image_url set, or None if not found
        """
        product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if product:
            ProductService._set_primary_image(product)
        return product
    
    @staticmethod
    def _apply_filters(query, filters: Dict[str, Any]):
        """Apply filter conditions to query."""
        if filters.get('category_id'):
            query = query.filter(ProductModel.category_id == filters['category_id'])
        if filters.get('q'):
            query = query.filter(ProductModel.name.ilike(f"%{filters['q']}%"))
        if filters.get('is_trending') is not None:
            query = query.filter(ProductModel.is_trending == filters['is_trending'])
        if filters.get('is_new_arrival') is not None:
            query = query.filter(ProductModel.is_new_arrival == filters['is_new_arrival'])
        if filters.get('is_award_winner') is not None:
            query = query.filter(ProductModel.is_award_winner == filters['is_award_winner'])
        if filters.get('is_festive') is not None:
            query = query.filter(ProductModel.is_festive == filters['is_festive'])
        if filters.get('for_men') is not None:
            query = query.filter(ProductModel.for_men == filters['for_men'])
        return query
    
    @staticmethod
    def _apply_sorting(query, sort: str):
        """Apply sorting to query."""
        if sort == "latest":
            query = query.order_by(desc(ProductModel.created_at))
        elif sort == "price_asc":
            query = query.order_by(asc(ProductModel.price_lkr))
        elif sort == "price_desc":
            query = query.order_by(desc(ProductModel.price_lkr))
        elif sort == "rating_desc":
            query = query.order_by(desc(ProductModel.rating))
        return query
    
    @staticmethod
    def _set_primary_image(product: ProductModel):
        """
        Set primary_image_url on product object.
        Uses primary image if available, otherwise falls back to first image.
        """
        # Sort images by sort_order
        sorted_images = sorted(product.images, key=lambda x: x.sort_order)
        
        # Find primary image
        primary_image = next((img for img in sorted_images if img.is_primary), None)
        
        # Fallback to first image if no primary
        if not primary_image and sorted_images:
            primary_image = sorted_images[0]
        
        # Set primary_image_url
        if primary_image:
            product.primary_image_url = primary_image.image_url
