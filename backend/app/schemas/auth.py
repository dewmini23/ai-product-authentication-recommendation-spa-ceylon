from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

# Registration Request
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = None
    gender: Optional[str] = Field(None, max_length=20)
    skin_type: Optional[str] = Field(None, max_length=50)
    
    @validator('age')
    def validate_age(cls, v):
        if v is not None and (v < 1 or v > 150):
            raise ValueError('Age must be between 1 and 150')
        return v

# User Output (no password)
class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int]
    gender: Optional[str]
    skin_type: Optional[str]
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Registration Response
class RegisterResponse(BaseModel):
    message: str
    user: UserOut

# Login Request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
