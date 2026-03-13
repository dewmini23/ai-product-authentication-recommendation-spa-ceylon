"""
authentication_service.py
Orchestrates the full product authentication pipeline:
  1. YOLO region detection
  2. Quality gate (missing required regions → unable_to_verify)
  3. Crop front_label and brand_block
  4. OCR on crops
  5. Text normalization + candidate matching + scoring
  6. Return structured result

Keeps route handler thin. Business logic lives here.
"""
import logging
from typing import Dict, Any

from app.services.yolo_auth_detector import yolo_auth_detector
from app.services.ocr_service import ocr_service
from app.utils.auth_scoring import score_authentication
from app.schemas.authentication import AuthVerifyResponse, BoundingBox, OCRResult

logger = logging.getLogger(__name__)

# Minimum confidence thresholds for required detections
MIN_PRODUCT_PACK_CONF = 0.30
MIN_FRONT_LABEL_CONF = 0.30
MIN_BRAND_BLOCK_CONF = 0.25


def _best_detection(detections: list, class_name: str) -> Dict | None:
    """Returns the highest-confidence detection for a given class, or None."""
    candidates = [d for d in detections if d["class_name"] == class_name]
    if not candidates:
        return None
    return max(candidates, key=lambda d: d["confidence"])


def verify_product_image(image_bytes: bytes) -> AuthVerifyResponse:
    """
    Main authentication pipeline.
    Args:
        image_bytes: Raw bytes of the uploaded image.
    Returns:
        AuthVerifyResponse with status, score, reasons, detections, ocr_text, debug.
    """
    # ── Step 1: YOLO Detection ────────────────────────────────────────────────
    try:
        raw_detections = yolo_auth_detector.detect(image_bytes)
    except RuntimeError as e:
        # Model not available — return a controlled error response, do not crash.
        logger.error(f"[AuthService] YOLO unavailable: {e}")
        return AuthVerifyResponse(
            status="unable_to_verify",
            score=0.0,
            reasons=[
                "The product authentication model is not available on this server. "
                "Please contact the administrator.",
                str(e),
            ],
            detections=[],
            ocr_text=OCRResult(),
            debug={"error": "yolo_model_missing"},
        )

    # Convert to schema objects for response
    detection_boxes = [
        BoundingBox(
            class_name=d["class_name"],
            confidence=d["confidence"],
            x=d["box"]["x"],
            y=d["box"]["y"],
            w=d["box"]["w"],
            h=d["box"]["h"],
        )
        for d in raw_detections
    ]

    # ── Step 2: Quality Gate ─────────────────────────────────────────────────
    reasons = []

    pack = _best_detection(raw_detections, "product_pack")
    label = _best_detection(raw_detections, "front_label")
    brand = _best_detection(raw_detections, "brand_block")

    if not pack or pack["confidence"] < MIN_PRODUCT_PACK_CONF:
        reasons.append(
            "Product packaging not detected. Ensure the full product is visible."
        )
        return AuthVerifyResponse(
            status="unable_to_verify",
            score=0.0,
            reasons=reasons,
            detections=detection_boxes,
            ocr_text=OCRResult(),
            debug={"quality_gate": "product_pack_missing"},
        )

    if not label or label["confidence"] < MIN_FRONT_LABEL_CONF:
        reasons.append(
            "Front label region not detected or confidence too low. "
            "Ensure the label is fully visible and well-lit."
        )
        return AuthVerifyResponse(
            status="unable_to_verify",
            score=0.0,
            reasons=reasons,
            detections=detection_boxes,
            ocr_text=OCRResult(),
            debug={"quality_gate": "front_label_missing"},
        )

    if not brand or brand["confidence"] < MIN_BRAND_BLOCK_CONF:
        reasons.append(
            "Brand block not detected or confidence too low. "
            "Ensure the brand logo/text area is visible."
        )
        return AuthVerifyResponse(
            status="unable_to_verify",
            score=0.0,
            reasons=reasons,
            detections=detection_boxes,
            ocr_text=OCRResult(),
            debug={"quality_gate": "brand_block_missing"},
        )

    # ── Step 3: OCR on Crops ─────────────────────────────────────────────────
    logger.debug(
        "[AuthService] OCR engine available=%s | brand_box=%s | label_box=%s",
        ocr_service.is_available,
        brand["box"],
        label["box"],
    )
    brand_text = ocr_service.extract_text_from_crop(image_bytes, brand["box"])
    label_text, label_metrics = ocr_service.extract_text_from_crop(image_bytes, label["box"], return_metrics=True)

    logger.info(f"[AuthService] OCR brand_text='{brand_text[:80]}' label_text='{label_text[:80]}'")

    # ── Step 3b: OCR-empty guard ──────────────────────────────────────────────
    # If OCR returned essentially nothing from BOTH regions, scoring would be
    # misleading. Return early with a clear readability-failure message.
    brand_has_text = len(brand_text.strip()) > 2
    label_has_text = len(label_text.strip()) > 2
    if not brand_has_text and not label_has_text:
        logger.warning("[AuthService] OCR returned no readable text from brand or label crops.")
        return AuthVerifyResponse(
            status="unable_to_verify",
            score=0.0,
            reasons=[
                "No readable text detected from brand or label regions. "
                "Improve lighting and focus, ensure the label is unobstructed, and try again."
            ],
            detections=detection_boxes,
            ocr_text=OCRResult(
                brand_text_raw=brand_text or None,
                label_text_raw=label_text or None,
            ),
            debug={"quality_gate": "ocr_empty", "brand_text_len": len(brand_text), "label_text_len": len(label_text)},
        )

    # ── Step 4: Scoring ───────────────────────────────────────────────────────
    ocr_reliable = bool(
        label_metrics.get("avg_conf", 0.0) >= 0.75 and
        label_metrics.get("token_count", 0) >= 6 and
        label_metrics.get("usable_chars", 0) >= 40
    )
    
    status, score, score_reasons, debug_info = score_authentication(brand_text, label_text, ocr_reliable=ocr_reliable)
    debug_info["ocr_reliable"] = ocr_reliable
    
    # ── Step 4b: Google OCR Fallback ──────────────────────────────────────────
    if status == "unable_to_verify" and debug_info.get("candidate_score", 0) < 40:
        logger.info("[AuthService] EasyOCR result ambiguous. Triggering Google OCR fallback for label.")
        label_google = ocr_service.extract_text_from_crop_google(image_bytes, label["box"])
        
        if label_google.strip():
            logger.info("[AuthService] Google OCR yielded text. Rescoring...")
            status, score, score_reasons, debug_info = score_authentication(brand_text, label_google, ocr_reliable=True)
            debug_info["ocr_reliable"] = True
            score_reasons.append("Rechecked label using cloud OCR due to low match confidence.")
            label_text = label_google

    reasons.extend(score_reasons)

    # ── Step 5: Visual Classifier Refinement (Optional) ───────────────────────
    from app.services.visual_auth_classifier import visual_auth_classifier
    import io
    from PIL import Image
    
    debug_info["visual_classifier_used"] = False
    debug_info["visual_fake_probs"] = {}
    debug_info["visual_p_fake"] = -1.0

    if visual_auth_classifier.is_available or visual_auth_classifier._load():
        try:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_w, img_h = pil_image.size
            valid_probs = []

            # helper to crop securely
            def get_crop(box_dict):
                x, y, w, h = box_dict["x"], box_dict["y"], box_dict["w"], box_dict["h"]
                # apply minor padding to ensure context is captured matching the training data
                pad_w, pad_h = int(w * 0.05), int(h * 0.05)
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(img_w, x + w + pad_w)
                y2 = min(img_h, y + h + pad_h)
                if x2 > x1 and y2 > y1:
                    return pil_image.crop((x1, y1, x2, y2))
                return None

            regions = {"product_pack": pack, "front_label": label, "brand_block": brand}
            
            for region_name, det in regions.items():
                if det and "box" in det:
                    crop_img = get_crop(det["box"])
                    if crop_img:
                        prob = visual_auth_classifier.predict_fake_probability(crop_img)
                        if prob >= 0.0:
                            debug_info["visual_fake_probs"][region_name] = round(prob, 4)
                            valid_probs.append(prob)

            if valid_probs:
                p_fake = max(valid_probs)
                debug_info["visual_p_fake"] = round(p_fake, 4)
                debug_info["visual_classifier_used"] = True
                
                logger.info(f"[AuthService] Visual classifier p_fake: {p_fake:.4f} (from {debug_info['visual_fake_probs']})")

                # Refinement Logic
                if p_fake >= 0.85 and status != "verified":
                    if status != "suspected_counterfeit":
                        logger.warning(f"[AuthService] Refined status down to suspected_counterfeit (p_fake={p_fake:.2f})")
                        reasons.append(f"Visual analysis strongly indicates a counterfeit pattern ({p_fake*100:.1f}% confidence).")
                        status = "suspected_counterfeit"
                elif p_fake >= 0.90 and status == "verified":
                    logger.warning(f"[AuthService] Refined status down to unable_to_verify (p_fake={p_fake:.2f})")
                    reasons.append(f"Text matches references, but visual analysis detected suspicious features ({p_fake*100:.1f}% confidence).")
                    status = "unable_to_verify"
        except Exception as e:
            logger.error(f"[AuthService] Error during visual refinement: {e}", exc_info=True)

    debug_info["yolo_pack_conf"] = pack["confidence"]
    debug_info["yolo_label_conf"] = label["confidence"]
    debug_info["yolo_brand_conf"] = brand["confidence"]
    # Lightweight OCR debug metadata (non-breaking additions)
    debug_info["ocr_engine_available"] = ocr_service.is_available
    debug_info["brand_text_len"] = len(brand_text)
    debug_info["label_text_len"] = len(label_text)
    debug_info["brand_ocr_empty"] = not brand_has_text
    debug_info["label_ocr_empty"] = not label_has_text

    return AuthVerifyResponse(
        status=status,
        score=score,
        reasons=reasons,
        detections=detection_boxes,
        ocr_text=OCRResult(
            brand_text_raw=brand_text or None,
            label_text_raw=label_text or None,
        ),
        debug=debug_info,
    )
