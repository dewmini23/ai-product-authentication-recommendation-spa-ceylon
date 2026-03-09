"""
ocr_service.py
EasyOCR wrapper service for product authentication.

OCR engine is loaded lazily so it does NOT block app startup.
Decoupled by design: route/business logic knows nothing about EasyOCR internals.
To swap engines later (cloud OCR, etc.), only change this file.

NOTE: On first use EasyOCR will download its English model files (~50 MB)
to ~/.EasyOCR/ (or %USERPROFILE%/.EasyOCR on Windows). Subsequent calls are instant.
"""
import io
import logging
import os
from typing import Optional

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

try:
    from app.services.google_ocr_service import google_ocr_service
except ImportError:
    google_ocr_service = None

logger = logging.getLogger(__name__)

# Minimum OCR confidence to accept a text line.
# 0.3 is tolerant enough for packaging text without drowning in noise.
OCR_CONF_THRESHOLD: float = 0.3

# Crops smaller than this in either dimension will be upscaled before OCR.
MIN_CROP_SIDE: int = 80
UPSCALE_FACTOR: int = 2


class OCRService:
    """Lazy-loading singleton EasyOCR wrapper."""

    _instance: Optional["OCRService"] = None
    _reader = None
    _load_attempted: bool = False
    _load_failed: bool = False

    def __new__(cls) -> "OCRService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load(self) -> bool:
        if self._load_attempted:
            return not self._load_failed

        self._load_attempted = True
        try:
            import easyocr  # deferred import — safe for startup
            # gpu=False → CPU inference (no CUDA required).
            # verbose=False → suppresses per-request stdout spam.
            self._reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            logger.info("[OCRService] EasyOCR Reader initialized successfully (CPU mode).")
            self._load_failed = False
            return True
        except Exception as e:
            logger.error("[OCRService] Failed to initialize EasyOCR: %s", e)
            self._load_failed = True
            return False

    @property
    def is_available(self) -> bool:
        return self._load()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _enhance_for_ocr(self, crop: Image.Image, pass_num: int) -> Image.Image:
        enhancer = ImageEnhance.Contrast(crop)
        if pass_num == 1:
            enhanced = enhancer.enhance(1.2)
            enhanced = enhanced.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        else:
            enhanced = enhancer.enhance(1.5)
            enhanced = enhanced.filter(ImageFilter.UnsharpMask(radius=3, percent=200, threshold=0))
        return enhanced

    def _image_bytes_to_pil(self, image_bytes: bytes) -> Image.Image:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    def _run_ocr(self, pil_image: Image.Image) -> tuple[list[str], float]:
        """
        Runs EasyOCR on a PIL image and returns accepted text lines and average confidence.

        EasyOCR readtext() returns a list of tuples:
            (bbox, text, confidence)

        Lines are kept if confidence >= OCR_CONF_THRESHOLD.
        """
        img_array = np.array(pil_image)
        h, w = img_array.shape[:2]
        logger.info("[OCRService] Image for OCR: %dx%d (HxW)", h, w)

        raw = self._reader.readtext(img_array)

        logger.info("[OCRService] EasyOCR raw detections: %d", len(raw))

        accepted: list[str] = []
        total_conf = 0.0
        for item in raw:
            # item = (bbox, text, conf) — always this tuple in EasyOCR
            try:
                _, text, conf = item
            except (ValueError, TypeError):
                logger.warning("[OCRService] Unexpected EasyOCR item format: %r", item)
                continue

            logger.info("[OCRService] Line: conf=%.3f  text=%r", conf, text[:60])
            if conf >= OCR_CONF_THRESHOLD:
                accepted.append(text)
                total_conf += conf

        avg_conf = (total_conf / len(accepted)) if accepted else 0.0

        logger.info(
            "[OCRService] Accepted %d / %d lines (threshold=%.2f), avg_conf=%.2f",
            len(accepted), len(raw), OCR_CONF_THRESHOLD, avg_conf
        )
        return accepted, avg_conf

    # ------------------------------------------------------------------
    # Public API — signatures unchanged from PaddleOCR version
    # ------------------------------------------------------------------
    def extract_text(self, image_bytes: bytes) -> str:
        """
        Extracts all text from raw image bytes.
        Returns a single space-joined string of detected text lines.
        Returns empty string on error.
        """
        if not self._load():
            logger.warning("[OCRService] EasyOCR unavailable, returning empty text.")
            return ""

        logger.info(
            "[OCRService] extract_text called. engine_ready=%s, threshold=%.2f",
            not self._load_failed, OCR_CONF_THRESHOLD,
        )

        try:
            pil_image = self._image_bytes_to_pil(image_bytes)
            lines, _ = self._run_ocr(pil_image)
            return " ".join(lines)
        except Exception as e:
            logger.error("[OCRService] OCR inference error: %s", e, exc_info=True)
            return ""

    def extract_text_from_crop(
        self, full_image_bytes: bytes, box: dict, return_metrics: bool = False
    ) -> str:
        """
        Crops a region from the full image using a YOLO bounding box dict
        {x, y, w, h} (pixel coordinates) and runs OCR on the crop.

        Crop coordinates are clamped to valid image dimensions before use.
        Small crops (< MIN_CROP_SIDE px on either side) are upscaled by
        UPSCALE_FACTOR before OCR to improve text detection.

        Returns extracted text or empty string.
        """
        if not self._load():
            logger.warning("[OCRService] EasyOCR unavailable, skipping crop OCR.")
            return ""

        try:
            img = self._image_bytes_to_pil(full_image_bytes)
            img_w, img_h = img.size
            x, y, w, h = int(box["x"]), int(box["y"]), int(box["w"]), int(box["h"])

            # Add 12% padding securely clipped to boundaries
            pad_w = int(w * 0.12)
            pad_h = int(h * 0.12)

            x1 = max(0, min(x - pad_w, img_w))
            y1 = max(0, min(y - pad_h, img_h))
            x2 = max(0, min(x + w + pad_w, img_w))
            y2 = max(0, min(y + h + pad_h, img_h))

            if x2 <= x1 or y2 <= y1:
                logger.warning(
                    "[OCRService] Crop box empty after clamping: "
                    "original=(%d,%d,%d,%d), image=(%d,%d). Skipping.",
                    x, y, w, h, img_w, img_h,
                )
                return ""

            crop = img.crop((x1, y1, x2, y2))
            crop_w, crop_h = crop.size

            logger.info(
                "[OCRService] Crop (with 12%% padding): x1=%d y1=%d x2=%d y2=%d → %dx%d px",
                x1, y1, x2, y2, crop_w, crop_h,
            )

            # Upscale 2x using BICUBIC interpolation
            new_w, new_h = crop_w * 2, crop_h * 2
            crop_upscaled = crop.resize((new_w, new_h), Image.BICUBIC)
            logger.info(
                "[OCRService] Upscaled crop 2x: %dx%d → %dx%d before OCR.",
                crop_w, crop_h, new_w, new_h,
            )

            # Pass 1: Mild enhancement
            pass1_crop = self._enhance_for_ocr(crop_upscaled, pass_num=1)
            lines, avg_conf = self._run_ocr(pass1_crop)
            text = " ".join(lines)
            
            # Fallback Retry calculations
            total_usable_chars = sum(c.isalnum() for c in text)
            token_count = len(text.split())
            
            logger.info(
                "[OCRService] Pass 1 results: usable_chars=%d, tokens=%d, avg_conf=%.2f",
                total_usable_chars, token_count, avg_conf
            )
            
            trigger_pass2 = (
                total_usable_chars < 25 or 
                token_count < 4 or 
                avg_conf < 0.45
            )

            # Keep track of best result across passes
            final_text = text
            
            if trigger_pass2:
                logger.info(
                    "[OCRService] Triggering Pass 2 (aggressive) because: "
                    "usable_chars < 25: %s, tokens < 4: %s, avg_conf < 0.45: %s",
                    total_usable_chars < 25, token_count < 4, avg_conf < 0.45
                )
                pass2_crop = self._enhance_for_ocr(crop_upscaled, pass_num=2)
                lines2, avg_conf = self._run_ocr(pass2_crop)
                final_text = " ".join(lines2)
                logger.info("[OCRService] Used Pass 2 (fallback) for crop OCR.")
                
            # Re-evaluate quality metric on final_text string directly
            final_usable_chars = sum(c.isalnum() for c in final_text)
            final_token_count = len(final_text.split())
            
            trigger_google_fallback = (
                final_usable_chars < 25 or 
                final_token_count < 4 or 
                avg_conf < 0.45
            )
            
            trigger_google_fallback = False # Disabled inline fallbacka
            
            if trigger_google_fallback and google_ocr_service is not None:
                logger.info("[OCRService] EasyOCR quality still poor. Triggering Google OCR fallback.")
                import io
                
                # Use the latest enhanced crop (pass2 if triggered, or pass1)
                best_crop = pass2_crop if trigger_pass2 else pass1_crop
                
                img_byte_arr = io.BytesIO()
                best_crop.save(img_byte_arr, format='JPEG', quality=95)
                google_text = google_ocr_service.extract_text(img_byte_arr.getvalue())
                
                if google_text.strip():
                    logger.info("[OCRService] Using Google OCR fallback for crop.")
                    return google_text
                else:
                    logger.info("[OCRService] Google OCR returned empty. Falling back to EasyOCR text.")
            
            if not trigger_pass2:
                logger.info("[OCRService] Used Pass 1 for crop OCR.")
                
            if return_metrics:
                return final_text, {
                    "usable_chars": final_usable_chars,
                    "token_count": final_token_count,
                    "avg_conf": avg_conf
                }
            return final_text

        except Exception as e:
            logger.error("[OCRService] Crop+OCR error: %s", e, exc_info=True)
            if return_metrics:
                return "", {"usable_chars": 0, "token_count": 0, "avg_conf": 0.0}
            return ""

    def extract_text_from_crop_google(
        self, full_image_bytes: bytes, box: dict
    ) -> str:
        """
        Crops a region from the full image and runs Google OCR on the crop.
        Returns extracted text or empty string.
        """
        if google_ocr_service is None:
            logger.warning("[OCRService] Google OCR unavailable, skipping google crop OCR.")
            return ""

        try:
            img = self._image_bytes_to_pil(full_image_bytes)
            img_w, img_h = img.size
            x, y, w, h = int(box["x"]), int(box["y"]), int(box["w"]), int(box["h"])

            # Add 12% padding securely clipped to boundaries
            pad_w = int(w * 0.12)
            pad_h = int(h * 0.12)

            x1 = max(0, min(x - pad_w, img_w))
            y1 = max(0, min(y - pad_h, img_h))
            x2 = max(0, min(x + w + pad_w, img_w))
            y2 = max(0, min(y + h + pad_h, img_h))

            if x2 <= x1 or y2 <= y1:
                if return_metrics:
                    return "", {"usable_chars": 0, "token_count": 0, "avg_conf": 0.0}
                return ""

            crop = img.crop((x1, y1, x2, y2))
            
            # Upscale 2x using BICUBIC interpolation
            crop_w, crop_h = crop.size
            new_w, new_h = crop_w * 2, crop_h * 2
            crop_upscaled = crop.resize((new_w, new_h), Image.BICUBIC)
            
            # Optional mild enhancement before sending to Google
            pass1_crop = self._enhance_for_ocr(crop_upscaled, pass_num=1)

            import io
            img_byte_arr = io.BytesIO()
            pass1_crop.save(img_byte_arr, format='JPEG', quality=95)
            
            google_text = google_ocr_service.extract_text(img_byte_arr.getvalue())
            
            if google_text.strip():
                logger.info("[OCRService] Successfully extracted text using Google OCR fallback method.")
                return google_text
                
            logger.info("[OCRService] Google OCR returned empty for crop.")
            return ""

        except Exception as e:
            logger.error("[OCRService] Google Crop+OCR error: %s", e, exc_info=True)
            return ""

# Module-level singleton
ocr_service = OCRService()
