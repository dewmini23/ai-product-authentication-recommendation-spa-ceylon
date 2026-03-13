"""
yolo_auth_detector.py
Singleton wrapper around YOLOv8 for product region detection.
Loaded lazily so a missing model file does NOT crash the application on startup.
Expected classes: product_pack, front_label, brand_block
"""
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Default model path — can be overridden via YOLO_AUTH_MODEL_PATH env variable.
_DEFAULT_MODEL_PATH = (
    Path(__file__).parent.parent.parent  # backend/
    / "ml_models"
    / "auth_detector"
    / "best.pt"
)


class YoloAuthDetector:
    """Lazy-loading singleton wrapper for YOLO product authentication detector."""

    _instance: Optional["YoloAuthDetector"] = None
    _model = None
    _model_path: Path = _DEFAULT_MODEL_PATH
    _load_attempted: bool = False
    _load_failed: bool = False
    # Tracks why the last load failed — used for retry decisions.
    # Values: None | 'file_missing' | 'load_error'
    _load_failed_reason: Optional[str] = None

    def __new__(cls) -> "YoloAuthDetector":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def configure(self, model_path: Optional[str] = None) -> None:
        
        env_path = os.environ.get("YOLO_AUTH_MODEL_PATH")
        if model_path:
            self._model_path = Path(model_path)
        elif env_path:
            self._model_path = Path(env_path)
        # else: keep _DEFAULT_MODEL_PATH

    def _maybe_reset_for_retry(self) -> None:
        
        if (
            self._load_attempted
            and self._load_failed
            and self._load_failed_reason == "file_missing"
            and self._model_path.exists()
        ):
            logger.info(
                f"[YoloAuthDetector] Model file now found at {self._model_path}. "
                "Resetting load state for retry."
            )
            self._load_attempted = False
            self._load_failed = False
            self._load_failed_reason = None
            self._model = None

    def _load(self) -> bool:
        """
        Attempts to load YOLO model. Returns True on success, False on failure.
        Retries once if previous failure was 'file_missing' and file now exists.
        """
        # Retry-safe: only reset if previous failure was a missing file
        self._maybe_reset_for_retry()

        if self._load_attempted:
            return not self._load_failed

        self._load_attempted = True

        if not self._model_path.exists():
            logger.warning(
                f"[YoloAuthDetector] Model file not found at: {self._model_path}. "
                "Product authentication will return 'unable_to_verify' until the model is placed there."
            )
            self._load_failed = True
            self._load_failed_reason = "file_missing"
            return False

        try:
            from ultralytics import YOLO  # imported here to keep startup safe
            self._model = YOLO(str(self._model_path))
            logger.info(f"[YoloAuthDetector] Model loaded from: {self._model_path}")
            self._load_failed = False
            self._load_failed_reason = None
            return True
        except Exception as e:
            logger.error(f"[YoloAuthDetector] Failed to load YOLO model: {e}")
            self._load_failed = True
            self._load_failed_reason = "load_error"
            return False

    @property
    def is_available(self) -> bool:
        return self._load()

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Run YOLO inference on raw image bytes.
        Returns list of detections: [{class_name, confidence, box: {x,y,w,h}}]
        Raises RuntimeError if model is unavailable.
        """
        if not self._load():
            raise RuntimeError(
                f"YOLO authentication model is not available. "
                f"Expected model file at: {self._model_path}. "
                "Please place the trained best.pt file there and restart the server."
            )

        import io
        import numpy as np
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        results = self._model(img_array, verbose=False)
        detections: List[Dict[str, Any]] = []

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                x1, y1, x2, y2 = xyxy
                detections.append(
                    {
                        "class_name": result.names[cls_id],
                        "confidence": round(conf, 4),
                        "box": {
                            "x": round(x1, 1),
                            "y": round(y1, 1),
                            "w": round(x2 - x1, 1),
                            "h": round(y2 - y1, 1),
                        },
                    }
                )

        return detections


# Module-level singleton
yolo_auth_detector = YoloAuthDetector()
