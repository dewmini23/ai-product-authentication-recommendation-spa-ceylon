from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


# Explicit allowed values for status — improves editor/docs support and catches bugs early.
# JSON serialization remains a plain string (Literal behaves like str in Pydantic).
AuthStatus = Literal["verified", "unable_to_verify", "suspected_counterfeit"]


class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    confidence: float
    class_name: str


class OCRResult(BaseModel):
    brand_text_raw: Optional[str] = None
    label_text_raw: Optional[str] = None


class AuthVerifyResponse(BaseModel):
    status: AuthStatus = Field(
        description="Authentication result: 'verified', 'unable_to_verify', or 'suspected_counterfeit'"
    )
    score: float = Field(ge=0, le=100, description="Confidence score from 0 to 100")
    reasons: List[str] = Field(default_factory=list)
    detections: List[BoundingBox] = Field(default_factory=list)
    ocr_text: OCRResult = Field(default_factory=OCRResult)
    debug: Optional[Dict[str, Any]] = Field(default=None)
