from fastapi import APIRouter, Depends
from app.schemas.ml import MLPredictRequest, MLPredictResponse
from app.services.concern_classifier import concern_classifier

router = APIRouter()

@router.post("/predict-tags", response_model=MLPredictResponse)
def predict_tags(request: MLPredictRequest):
    """
    Predict product tags from a text description using the pre-trained DistilBERT model.
    """
    # Prediction defaults to 0.5 or uses request threshold
    predicted_tags = concern_classifier.predict(
        text=request.text,
        threshold=request.threshold
    )
    
    return MLPredictResponse(
        tags=predicted_tags,
        threshold=request.threshold
    )
