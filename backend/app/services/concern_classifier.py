import os
import torch
import joblib
from transformers import DistilBertModel, DistilBertTokenizerFast
from torch import nn
import logging

logger = logging.getLogger(__name__)

class ConcernClassifierModel(nn.Module):
    def __init__(self, num_labels=22):
        super(ConcernClassifierModel, self).__init__()
        self.distilbert = DistilBertModel.from_pretrained("distilbert-base-uncased")
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, num_labels)
        
    def forward(self, input_ids, attention_mask):
        outputs = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs[0][:, 0]  # CLS token
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits

class ConcernClassifierService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConcernClassifierService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.tokenizer = None
        self.mlb = None
        self.classes = []
        self._initialized = True
        
    def load_model(self, base_path: str = "ml_models/spaceylon_concern_classifier"):
        logger.info(f"Loading ConcernClassifier model from {base_path} on {self.device}")
        
        try:
            # Load tokenizer
            tokenizer_path = os.path.join(base_path, "tokenizer")
            self.tokenizer = DistilBertTokenizerFast.from_pretrained(tokenizer_path)
            
            # Load MultiLabelBinarizer
            mlb_path = os.path.join(base_path, "mlb.pkl")
            self.mlb = joblib.load(mlb_path)
            self.classes = self.mlb.classes_
            
            # Load model
            self.model = ConcernClassifierModel(num_labels=len(self.classes))
            model_path = os.path.join(base_path, "model_weights.pt")
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            
            self.model.to(self.device)
            self.model.eval()
            logger.info("ConcernClassifier loaded successfully.")
            
        except Exception as e:
            logger.error(f"Failed to load ConcernClassifier: {str(e)}")
            raise e

    def predict(self, text: str, threshold: float = 0.5):
        text = text.strip()
        if not text:
            return []
            
        if self.model is None:
            raise RuntimeError("Model is not loaded. Call load_model() first.")
            
        inputs = self.tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            padding=True, 
            max_length=128
        )
        
        input_ids = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)
        
        with torch.no_grad():
            logits = self.model(input_ids, attention_mask)
            probs = torch.sigmoid(logits).squeeze().cpu().numpy()
            
        # Get active tags based on threshold
        results = []
        for i, prob in enumerate(probs):
            if prob >= threshold:
                results.append((self.classes[i], float(prob)))
                
        # Sort by probability descending and cap at 5
        results.sort(key=lambda x: x[1], reverse=True)
        results = results[:5]
        
        # Return only the tag names
        return [tag for tag, prob in results]

# Singleton instance export
concern_classifier = ConcernClassifierService()
