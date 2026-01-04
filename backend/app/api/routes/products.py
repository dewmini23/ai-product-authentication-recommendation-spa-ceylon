from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, subqueryload
from typing import List, Optional
from sqlalchemy import desc, asc
from app.db.session import get_db
from app.models import Product as ProductModel, ProductImage as ProductImageModel
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter()


@router.post("/", response_model=Product)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = ProductModel(
        name=product.name,
        short_description=product.short_description,
        description=product.description,
        ingredients=product.ingredients,
        how_to_use=product.how_to_use,
        price_lkr=product.price_lkr,
        rating=product.rating,
        review_count=product.review_count,
        stock_qty=product.stock_qty,
        category_id=product.category_id,
        is_trending=product.is_trending,
        is_new_arrival=product.is_new_arrival,
        is_award_winner=product.is_award_winner,
        is_festive=product.is_festive,
        for_men=product.for_men,
        ingredient_highlights=[h.dict() for h in product.ingredient_highlights] if product.ingredient_highlights else None
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    if product.images:
        for img in product.images:
            db_image = ProductImageModel(
                product_id=db_product.id,
                image_url=img.image_url,
                sort_order=img.sort_order,
                is_primary=img.is_primary
            )
            db.add(db_image)
        db.commit()
        db.refresh(db_product)
    
    # Set primary_image_url using service helper
    ProductService._set_primary_image(db_product)
    
    return db_product


@router.get("/", response_model=List[Product])
def read_products(
    db: Session = Depends(get_db),
    category_id: Optional[int] = None,
    q: Optional[str] = None,
    is_trending: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_award_winner: Optional[bool] = None,
    is_festive: Optional[bool] = None,
    for_men: Optional[bool] = None,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    sort: Optional[str] = Query("latest", regex="^(latest|price_asc|price_desc|rating_desc)$", description="Sort order")
):
    filters = {
        'category_id': category_id,
        'q': q,
        'is_trending': is_trending,
        'is_new_arrival': is_new_arrival,
        'is_award_winner': is_award_winner,
        'is_festive': is_festive,
        'for_men': for_men
    }
    return ProductService.list_products(db, filters, page, limit, sort)

@router.get("/{id}", response_model=Product)
def read_product(id: int, db: Session = Depends(get_db)):
    product = ProductService.get_product_by_id(db, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{id}", response_model=Product)
def update_product(id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    
    # Handle ingredient_highlights specifically if present
    if 'ingredient_highlights' in update_data:
         # Pydantic dict() might have already converted nested models to dicts, but let's be safe.
         # Actually with exclude_unset=True, simple assignment should work if SQLAlchemy handles JSONB.
         # The list of dicts from Pydantic is exactly what JSONB column expects.
         pass 

    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    
    # Set primary_image_url using service helper
    ProductService._set_primary_image(db_product)
        
    return db_product


@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}
