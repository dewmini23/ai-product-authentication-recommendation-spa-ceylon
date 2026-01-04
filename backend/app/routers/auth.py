from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, RegisterResponse, UserOut, LoginRequest, TokenResponse
from app.models.user import User
from app.utils.jwt import create_access_token
from app.deps.auth import get_current_user
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new customer user.
    
    SECURITY: This endpoint ALWAYS creates role=CUSTOMER.
    Frontend cannot create ADMIN users.
    """
    try:
        new_user = AuthService.create_user(db, request)
        return RegisterResponse(
            message="Registration successful",
            user=UserOut.from_orm(new_user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT access token.
    """
    try:
        user = AuthService.authenticate_user(db, request.email, request.password)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "email": user.email
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    Protected endpoint - requires valid JWT token.
    """
    return UserOut.from_orm(current_user)

