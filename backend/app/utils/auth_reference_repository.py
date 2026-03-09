"""
auth_reference_repository.py
Thin DB helper for loading active product authentication references.

This is add-only — MOCK_PRODUCT_REFERENCES in auth_scoring.py is untouched.
Use this helper when you are ready to switch the scoring logic to use the DB.
"""
from typing import Any, Dict, List

from app.db.session import SessionLocal
from app.models.product_auth_reference import ProductAuthReference


def get_active_auth_references_from_db() -> List[Dict[str, Any]]:
    """
    Load all active ProductAuthReference rows and return them in the
    same shape expected by score_authentication() in auth_scoring.py:

    [
        {
            "id": <ref_code>,          # string — same key name as MOCK list
            "name": <name>,
            "brand_keywords": [...],
            "label_keywords": [...],
        },
        ...
    ]

    DB session is always closed safely via try/finally.
    brand_keywords / label_keywords fall back to [] if stored as None.
    """
    db = SessionLocal()
    try:
        rows: List[ProductAuthReference] = (
            db.query(ProductAuthReference)
            .filter(ProductAuthReference.is_active == True)   # noqa: E712
            .order_by(ProductAuthReference.id)
            .all()
        )
        return [
            {
                "id": row.ref_code,
                "name": row.name,
                "brand_keywords": row.brand_keywords or [],
                "label_keywords": row.label_keywords or [],
            }
            for row in rows
        ]
    finally:
        db.close()


def count_active_auth_references_from_db() -> int:
    """Return the number of active rows in product_auth_references."""
    db = SessionLocal()
    try:
        return (
            db.query(ProductAuthReference)
            .filter(ProductAuthReference.is_active == True)   # noqa: E712
            .count()
        )
    finally:
        db.close()
