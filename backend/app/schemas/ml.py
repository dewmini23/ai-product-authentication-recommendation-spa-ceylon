from typing import List, Optional
from pydantic import BaseModel, Field

class MLPredictRequest(BaseModel):
    text: str
    threshold: Optional[float] = Field(0.5, ge=0.0, le=1.0)

class MLPredictResponse(BaseModel):
    tags: List[str]
    threshold: float
