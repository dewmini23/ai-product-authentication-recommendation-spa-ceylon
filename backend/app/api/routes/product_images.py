from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import ProductImage as ProductImageModel, Product as ProductModel
from app.schemas.product_image import ProductImage, ProductImageCreate

router = APIRouter()


@router.post("/{id}/images", response_model=ProductImage)
def create_product_image(id: int, image: ProductImageCreate, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # If this is the first image or marked primary, handle logic if needed
    # For now, we trust the input. If strict "one primary" is needed, we should update others here.
    if image.is_primary:
        # Unset primary for other images of this product
        db.query(ProductImageModel).filter(
            ProductImageModel.product_id == id
        ).update({"is_primary": False})
        
    db_image = ProductImageModel(
        product_id=id,
        image_url=image.image_url,
        sort_order=image.sort_order,
        is_primary=image.is_primary
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

@router.put("/{id}/images/{image_id}", response_model=ProductImage)
def update_product_image(id: int, image_id: int, image_update: ProductImageCreate, db: Session = Depends(get_db)):
    db_image = db.query(ProductImageModel).filter(
        ProductImageModel.id == image_id,
        ProductImageModel.product_id == id
    ).first()
    
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    if image_update.is_primary and not db_image.is_primary:
        # Unset primary for other images
        db.query(ProductImageModel).filter(
            ProductImageModel.product_id == id
        ).update({"is_primary": False})
    
    db_image.image_url = image_update.image_url
    db_image.sort_order = image_update.sort_order
    db_image.is_primary = image_update.is_primary
    
    db.commit()
    db.refresh(db_image)
    return db_image

@router.delete("/{id}/images/{image_id}")
def delete_product_image(id: int, image_id: int, db: Session = Depends(get_db)):
    db_image = db.query(ProductImageModel).filter(
        ProductImageModel.id == image_id,
        ProductImageModel.product_id == id
    ).first()
    
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    db.delete(db_image)
    db.commit()
    return {"message": "Image deleted"}
