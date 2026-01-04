from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.utils.security import hash_password, verify_password


class AuthService:
    """Service layer for authentication business logic."""
    
    @staticmethod
    def create_user(db: Session, user_data: RegisterRequest) -> User:
        """
        Create a new customer user.
        
        Args:
            db: Database session
            user_data: Registration request data
            
        Returns:
            Created User object
            
        Raises:
            ValueError: If email already exists or database error occurs
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError(f"Email '{user_data.email}' is already registered")
        
        # Create new user with CUSTOMER role (ALWAYS)
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            age=user_data.age,
            gender=user_data.gender,
            skin_type=user_data.skin_type,
            role=User.ROLE_CUSTOMER  # ALWAYS CUSTOMER
        )
        
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        except IntegrityError:
            db.rollback()
            raise ValueError("Email already registered")
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Authenticate user by email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            Authenticated User object
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise ValueError("Invalid credentials")
        
        # Verify password
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")
        
        return user
