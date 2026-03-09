from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import time
import base64
import re
from pathlib import Path
from app.db.session import get_db
from app.models import ProductImage as ProductImageModel, Product as ProductModel
from app.schemas.product_image import ProductImage, ProductImageCreate

# Absolute path to backend/uploads/products, regardless of CWD
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_PRODUCTS_DIR = BACKEND_DIR / "uploads" / "products"
UPLOAD_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()

@router.post("/images/migrate-base64")
def migrate_base64_images(db: Session = Depends(get_db)):
    all_images = db.query(ProductImageModel).all()
    
    migrated = 0
    skipped = 0
    errors = []
    
    for img in all_images:
        if img.image_url and img.image_url.startswith("/uploads/products/"):
            skipped += 1
            continue
            
        if img.image_url and img.image_url.startswith("data:"):
            # It's a base64 string
            match = re.match(r'data:image/([a-zA-Z0-9]+);base64,(.+)', img.image_url)
            if match:
                ext = match.group(1)
                if ext == 'jpeg':
                    ext = 'jpg'
                base64_data = match.group(2)
                
                try:
                    decoded_data = base64.b64decode(base64_data)
                    filename = f"p{img.product_id}_{img.id}_migrated.{ext}"
                    filepath = UPLOAD_PRODUCTS_DIR / filename
                    
                    with open(str(filepath), "wb") as f:
                        f.write(decoded_data)
                    
                    img.image_url = f"/uploads/products/{filename}"
                    migrated += 1
                except Exception as e:
                    print(f"Failed to migrate image {img.id}: {e}")
                    errors.append(img.id)
            else:
                errors.append(img.id)
        else:
            # Maybe it's a completely different external link, leave it alone but log as skipped
            skipped += 1
    
    db.commit()
    return {
        "migrated": migrated,
        "skipped": skipped,
        "errors": errors
    }

@router.post("/{id}/images/upload", response_model=List[ProductImage])
def upload_product_image(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    ext = file.filename.split('.')[-1] if '.' in file.filename else "jpg"
    timestamp = int(time.time())
    
    existing_count = db.query(ProductImageModel).filter(ProductImageModel.product_id == id).count()
    filename = f"p{id}_{timestamp}_{existing_count}.{ext}"
    filepath = UPLOAD_PRODUCTS_DIR / filename  # Absolute path - always correct!

    with open(str(filepath), "wb") as buffer:
        buffer.write(file.file.read())

    is_primary = (existing_count == 0)
    db_image = ProductImageModel(
        product_id=id,
        image_url=f"/uploads/products/{filename}",  # Always store as relative path
        sort_order=existing_count,
        is_primary=is_primary
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    db.refresh(product)

    return product.images

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
        
    if db_image.image_url and db_image.image_url.startswith("/uploads/products/"):
        filepath = db_image.image_url.lstrip("/")
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Failed to delete file {filepath}: {e}")
                
    db.delete(db_image)
    db.commit()
    return {"message": "Image deleted"}
