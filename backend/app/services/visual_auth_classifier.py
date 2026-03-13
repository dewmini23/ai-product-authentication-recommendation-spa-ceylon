import logging
import os
from PIL import Image

logger = logging.getLogger(__name__)

# Fallback values if YOLO inference fails
UNAVAILABLE_SCORE = -1.0


class VisualAuthClassifier:
    """
    Optional refinement layer. Loads the binary visual classifier
    capable of identifying 'fake' or 'genuine' from image crops.
    Safe-fails if ultralytics is not installed or the model file is missing.
    """

    def __init__(self):
        self.model = None
        self._load_attempted = False
        self.is_available = False
        self.model_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "ml_models",
            "auth_visual_classifier",
            "auth_visual_classifier.pt"
        )

    def _load(self):
        if self._load_attempted:
            return self.is_available

        self._load_attempted = True
        try:
            from ultralytics import YOLO
            if not os.path.exists(self.model_path):
                logger.warning(f"[VisualAuthClassifier] Model not found at '{self.model_path}'. Optional visual refinement disabled.")
                return False

            self.model = YOLO(self.model_path)
            self.is_available = True
            logger.info("[VisualAuthClassifier] Loaded visual classifier model successfully.")
            return True
        except ImportError:
            logger.warning("[VisualAuthClassifier] 'ultralytics' module not installed. Visual classifier disabled.")
            return False
        except Exception as e:
            logger.error(f"[VisualAuthClassifier] Error loading model: {e}")
            return False

    def predict_fake_probability(self, crop: Image.Image) -> float:
        """
        Runs inference on a PIL Image crop.
        Returns the probability (0.0 to 1.0) that the crop is 'fake'.
        Returns -1.0 if inference fails or the class is not detected.
        """
        if not self._load():
            return UNAVAILABLE_SCORE

        try:
            # inference configuration tailored to suppress YOLO logging
            results = self.model.predict(source=crop, verbose=False)
            
            if not results:
                return UNAVAILABLE_SCORE

            result = results[0]
            probs = result.probs
            
            if probs is None:
                return UNAVAILABLE_SCORE
            
            names = result.names
            if "fake" not in names.values():
                return UNAVAILABLE_SCORE

            # Get the index of the 'fake' class
            fake_class_id = list(names.keys())[list(names.values()).index("fake")]
            
            # Extract the probability for 'fake'
            fake_prob = float(probs.data[fake_class_id])
            return fake_prob

        except Exception as e:
            logger.warning(f"[VisualAuthClassifier] Inference failed on crop: {e}")
            return UNAVAILABLE_SCORE


# Singleton instance
visual_auth_classifier = VisualAuthClassifier()
