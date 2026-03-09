"""
google_ocr_service.py
Google Cloud Vision API wrapper for product authentication.

This service is independent of the existing EasyOCR flow.
"""
import logging
from typing import Optional

try:
    from google.cloud import vision
    from google.api_core.exceptions import PermissionDenied
except ImportError:
    vision = None
    PermissionDenied = None

logger = logging.getLogger(__name__)


class GoogleOCRService:
    """Wrapper for Google Cloud Vision API (document_text_detection)."""

    def __init__(self):
        self._client: Optional[vision.ImageAnnotatorClient] = None
        self._client_initialized = False

    def _get_client(self) -> Optional[vision.ImageAnnotatorClient]:
        if vision is None:
            logger.warning("[GoogleOCRService] google-cloud-vision is not installed.")
            return None

        if not self._client_initialized:
            try:
                self._client = vision.ImageAnnotatorClient()
                logger.info("[GoogleOCRService] Google Vision Client initialized successfully.")
            except Exception as e:
                logger.error("[GoogleOCRService] Failed to initialize Google Vision Client: %s", e)
            finally:
                self._client_initialized = True
                
        return self._client

    def extract_text(self, image_bytes: bytes) -> str:
        """
        Extracts document text from raw image bytes using Google Cloud Vision.
        Uses document_text_detection which is optimized for dense text.
        
        Returns a single string (the full detected text) or an empty string on error.
        """
        client = self._get_client()
        if not client:
            return ""

        try:
            image = vision.Image(content=image_bytes)
            # document_text_detection is better for dense/small text like packaging
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                logger.error(
                    "[GoogleOCRService] Vision API error: %s\nFor more details see: "
                    "https://cloud.google.com/apis/design/errors",
                    response.error.message,
                )
                return ""

            if response.full_text_annotation:
                text = response.full_text_annotation.text
                logger.info("[GoogleOCRService] Successfully extracted %d characters.", len(text))
                return text
            
            logger.info("[GoogleOCRService] No text detected in image.")
            return ""

        except PermissionDenied as e:
            logger.warning("[GoogleOCRService] Vision API PermissionDenied: %s. Returning empty text.", e)
            return ""
        except Exception as e:
            logger.error("[GoogleOCRService] OCR inference error: %s", e)
            return ""


# Module-level singleton
google_ocr_service = GoogleOCRService()
