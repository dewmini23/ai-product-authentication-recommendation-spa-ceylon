from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    """User model with String role field (not enum) for Alembic simplicity."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    skin_type = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, server_default='CUSTOMER')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Role validation constants
    ROLE_ADMIN = "ADMIN"
    ROLE_CUSTOMER = "CUSTOMER"
    VALID_ROLES = [ROLE_ADMIN, ROLE_CUSTOMER]
