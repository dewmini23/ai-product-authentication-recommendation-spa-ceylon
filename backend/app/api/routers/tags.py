from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.tag import Tag, ProductTag
from app.models.product import Product
from app.models.category import Category
from app.schemas.tag import TagCreate, TagOut, ReplaceTagsIn

router = APIRouter()

@router.get("/tags", response_model=List[TagOut])
def get_tags(
    tag_type: Optional[str] = Query(None, regex="^(skin|hair|perfume|general|face|body|mind|skin_type)$"),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Tag)
    if tag_type:
        query = query.filter(Tag.tag_type == tag_type)
    if q:
        query = query.filter(Tag.name.ilike(f"%{q}%"))
    return query.all()

@router.post("/tags", response_model=TagOut)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    valid_types = ["face", "hair", "body", "mind", "skin", "perfume", "general", "skin_type"]
    if tag.tag_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid tag_type. Must be one of: {', '.join(valid_types)}")

    existing = db.query(Tag).filter(func.lower(Tag.name) == tag.name.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    new_tag = Tag(name=tag.name, tag_type=tag.tag_type)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag

@router.post("/tags/seed")
def seed_master_tags(db: Session = Depends(get_db)):
    seed_data = {
        "skin": ["acne_control", "oil_control", "marks_blemishes", "pigmentation_discoloration", "fine_lines_wrinkles", "under_eye_darkness", "sunburns", "dryness_relief", "soothing"],
        "hair": ["hair_fall", "dry_unruly", "damaged_colored", "dandruff_scalp", "fragile_hair", "oily_flat_dull"],
        "body": ["marks_discolouration", "back_acne", "dry_dehydrated_skin", "cracked_heels"],
        "mind": ["restless_sleep", "stress", "relaxation"]
    }

    added_count = 0
    for tag_type, names in seed_data.items():
        for name in names:
            existing = db.query(Tag).filter(
                func.lower(Tag.name) == name.lower(), 
                Tag.tag_type == tag_type
            ).first()
            if not existing:
                new_tag = Tag(name=name, tag_type=tag_type)
                db.add(new_tag)
                added_count += 1
    
    if added_count > 0:
        db.commit()
        
    return {"message": f"Successfully seeded {added_count} new tags."}

@router.get("/products/{product_id}/tags", response_model=List[TagOut])
def get_product_tags(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product.tags

@router.post("/products/{product_id}/tags", response_model=List[TagOut])
def replace_product_tags(product_id: int, payload: ReplaceTagsIn, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # 1. Resolve Tag Objects (Find or Create)
    tag_objects = []
    
    valid_types = ["face", "hair", "body", "mind", "skin", "perfume", "general", "skin_type"]

    for tag_input in payload.tags:
        # Clean/Normalize
        tag_name = tag_input.name.strip()
        if not tag_name:
            continue
            
        if tag_input.tag_type not in valid_types:
             raise HTTPException(status_code=400, detail=f"Invalid tag_type '{tag_input.tag_type}'. Must be one of: {', '.join(valid_types)}")

        # Case insensitive check + tag_type collision fix
        tag = db.query(Tag).filter(func.lower(Tag.name) == tag_name.lower(), Tag.tag_type == tag_input.tag_type).first()
        if not tag:
            # Create new
            tag = Tag(name=tag_name, tag_type=tag_input.tag_type)
            db.add(tag)
            db.commit()
            db.refresh(tag)
            
        tag_objects.append(tag)
    
    # 2. Update Relationship
    try:
        product.tags = tag_objects
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")
    return product.tags
