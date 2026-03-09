"""
seed_product_auth_references.py
Upsert seed data into the product_auth_references table.

Run from backend/ with venv active:
    python scripts/seed_product_auth_references.py

Safe to re-run — existing rows are updated, not duplicated.
"""
import json
import sys
from pathlib import Path

# Allow imports from app/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.product_auth_reference import ProductAuthReference

SEED_FILE = Path(__file__).resolve().parent.parent / "app" / "data" / "product_auth_references.seed.json"


def main() -> None:
    seed_data = json.loads(SEED_FILE.read_text(encoding="utf-8"))

    db = SessionLocal()
    inserted = 0
    updated = 0

    try:
        for entry in seed_data:
            ref_code: str = entry["id"]
            existing = (
                db.query(ProductAuthReference)
                .filter(ProductAuthReference.ref_code == ref_code)
                .first()
            )

            if existing:
                existing.name            = entry["name"]
                existing.brand_keywords  = entry.get("brand_keywords", [])
                existing.label_keywords  = entry.get("label_keywords", [])
                existing.is_active       = entry.get("is_active", True)
                updated += 1
                print(f"  [UPDATE] {ref_code}")
            else:
                row = ProductAuthReference(
                    ref_code        = ref_code,
                    name            = entry["name"],
                    brand_keywords  = entry.get("brand_keywords", []),
                    label_keywords  = entry.get("label_keywords", []),
                    is_active       = entry.get("is_active", True),
                )
                db.add(row)
                inserted += 1
                print(f"  [INSERT] {ref_code}")

        db.commit()
        print(f"\nDone — {inserted} inserted, {updated} updated.")

    except Exception as exc:
        db.rollback()
        print(f"ERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
