from typing import List, Optional, Dict, Any, Set
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.product import Product
from app.models.tag import Tag, ProductTag
from app.schemas.product import Product as ProductSchema

router = APIRouter()


# ── Response schema ─────────────────────────────────────────────────────────

class ProductRecommendation(BaseModel):
    product: ProductSchema
    score: int
    matched_tags: List[str] = []
    matched_types: List[str] = []
    applied_skin_types: List[str] = []
    skin_type_used: List[str] = []
    filter_mode: Optional[str] = None
    skin_match: Optional[bool] = None
    has_skin_tags: Optional[bool] = None

    class Config:
        from_attributes = True


# ── Helper ───────────────────────────────────────────────────────────────────

def _normalise(csv: Optional[str]) -> List[str]:
    """Split a comma-separated query param and lower-case each entry."""
    if not csv:
        return []
    return [t.strip().lower() for t in csv.split(",") if t.strip()]


ALLOWED_CONCERN_TYPES = {"face", "hair", "body", "mind", "skin", "general", "perfume"}

# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.get("/recommendations/products", response_model=List[ProductRecommendation])
def get_recommendations(
    concern_tags: Optional[str] = Query(None, description="Comma-separated concern tag names"),
    skin_types: Optional[str] = Query(None, description="Comma-separated skin-type tag names"),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Return products ranked by relevance to the supplied tags. Domain-aware scoring.

    Scoring:
      +10  for each matching concern tag
      +3   for each matching skin-type tag (ONLY if matched concern types include face or skin)

    Products MUST match at least one concern tag to be returned.
    Results ordered by score DESC, then created_at DESC.
    """
    concern_list = _normalise(concern_tags)
    skin_list = _normalise(skin_types)

    if not concern_list:
        return []

    # 1. Resolve concern tags to valid Tag rows belonging to allowed types
    valid_concern_tags = db.query(Tag).filter(
        Tag.tag_type.in_(ALLOWED_CONCERN_TYPES),
        func.lower(Tag.name).in_(concern_list)
    ).all()
    
    if not valid_concern_tags:
        return []
        
    valid_concern_tag_names = {t.name.lower() for t in valid_concern_tags}
    valid_concern_tag_ids = {t.id for t in valid_concern_tags}
    
    applied_skin_types = []
    if skin_list:
        valid_skin_tags = db.query(Tag).filter(
            Tag.tag_type == "skin_type",
            func.lower(Tag.name).in_(skin_list)
        ).all()
        applied_skin_types = [t.name.lower() for t in valid_skin_tags]

    # 2. Get products that have AT LEAST ONE of these matched concern_tag_ids
    product_ids_query = db.query(ProductTag.product_id).filter(
        ProductTag.tag_id.in_(valid_concern_tag_ids)
    ).distinct()

    product_ids = [row[0] for row in product_ids_query.all()]
    if not product_ids:
        return []

    # 3. Retrieve eligible products and ALL their tags for scoring
    eligible_products = db.query(Product).filter(Product.id.in_(product_ids)).order_by(Product.created_at.desc()).all()
    
    # Batch fetch tags for these products
    product_tags_mapping: Dict[int, List[Tag]] = {pid: [] for pid in product_ids}
    pt_rows = db.query(ProductTag, Tag).join(Tag, ProductTag.tag_id == Tag.id).filter(
        ProductTag.product_id.in_(product_ids)
    ).all()
    
    for pt, tg in pt_rows:
        product_tags_mapping[pt.product_id].append(tg)
        
    # 4. Score and build responses
    print(f"[DEBUG RECOMMENDATIONS] Normalized concern_tags: {concern_list}, skin_types: {skin_list}")

    results = []

    for product in eligible_products:
        p_tags = product_tags_mapping[product.id]
        
        score = 0
        matched_tag_names: Set[str] = set()
        matched_tag_types: Set[str] = set()
        
        # Check concern matches
        for tg in p_tags:
            tg_name_lower = tg.name.lower()
            if tg.tag_type in ALLOWED_CONCERN_TYPES and tg_name_lower in valid_concern_tag_names:
                score += 10
                matched_tag_names.add(tg.name)
                matched_tag_types.add(tg.tag_type)
                
        if score == 0:
            continue
            
        p_skin_tags = [tg for tg in p_tags if tg.tag_type == "skin_type"]
        p_skin_names = {tg.name.lower() for tg in p_skin_tags}
        
        has_skin_tags = len(p_skin_tags) > 0
        skin_match = False
        skin_used = []
        
        if applied_skin_types:
            if not has_skin_tags:
                # Include as universal/general
                pass
            else:
                effective_skin_types = set(applied_skin_types)
                effective_skin_types.add("normal")
                bonus_tags = p_skin_names.intersection(effective_skin_types)
                if not bonus_tags:
                    # Exclude wrong-skin-type product
                    continue
                else:
                    skin_match = True
                    score += 3 * len(bonus_tags)
                    skin_used = list(bonus_tags)
                    for tg in p_skin_tags:
                        if tg.name.lower() in effective_skin_types:
                            matched_tag_names.add(tg.name)
                            matched_tag_types.add(tg.tag_type)

        results.append({
            "product": product,
            "score": score,
            "matched_tags": list(matched_tag_names),
            "matched_types": list(matched_tag_types),
            "applied_skin_types": applied_skin_types,
            "skin_type_used": skin_used,
            "filter_mode": "option3_smart",
            "skin_match": skin_match,
            "has_skin_tags": has_skin_tags
        })
        
    # 5. Sort by score DESC
    results.sort(key=lambda x: x["score"], reverse=True)
    
    final_results = results[:limit]
    print(f"[DEBUG RECOMMENDATIONS] Returned {len(final_results)} products")
    return final_results
