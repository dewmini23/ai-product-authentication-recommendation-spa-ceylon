"""
product_authentication.py
Router for the product authentication endpoint.
Filename uses 'product_authentication' to avoid import confusion with
the existing user auth router at app/routers/auth.py.
Route prefix is /api/authentication (registered in main.py).
"""
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.authentication import AuthVerifyResponse
from app.services.authentication_service import verify_product_image

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Upload constraints ────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB — adjust here if needed
ALLOWED_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp")


@router.post(
    "/verify",
    response_model=AuthVerifyResponse,
    summary="Verify product authenticity from an image",
    description=(
        "Upload a product image to run YOLO region detection, OCR text extraction, "
        "and scoring to determine if the product is verified, suspected counterfeit, "
        "or unable to verify. Max upload size: 10 MB."
    ),
)
async def verify_product(
    file: UploadFile = File(..., description="Product image to authenticate (JPEG/PNG/WebP, max 10 MB)"),
) -> AuthVerifyResponse:
    """POST /api/authentication/verify"""

    # ── File type guard ───────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: '{file.content_type}'. "
                f"Accepted types: {', '.join(ALLOWED_CONTENT_TYPES)}."
            ),
        )

    image_bytes = await file.read()

    # ── Empty file guard ──────────────────────────────────────────────────────
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── File size guard ───────────────────────────────────────────────────────
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large: {len(image_bytes) / (1024 * 1024):.1f} MB. "
                f"Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
            ),
        )

    logger.info(
        f"[AuthRouter] Received image '{file.filename}' "
        f"({len(image_bytes) / 1024:.1f} KB) for authentication."
    )

    # ── Service call with exception guard ────────────────────────────────────
    try:
        result = verify_product_image(image_bytes)
        return result
    except Exception:
        logger.exception(
            f"[AuthRouter] Unexpected error processing image '{file.filename}'."
        )
        raise HTTPException(
            status_code=500,
            detail="Authentication processing failed. Please try again or contact support.",
        )
