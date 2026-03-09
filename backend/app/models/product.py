from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_description = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    ingredients = Column(Text, nullable=True)
    how_to_use = Column(Text, nullable=True)
    price_lkr = Column(Numeric(10, 2), nullable=False)
    rating = Column(Numeric(2, 1), default=0)
    review_count = Column(Integer, default=0)
    stock_qty = Column(Integer, default=0)
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    is_trending = Column(Boolean, default=False)
    is_new_arrival = Column(Boolean, default=False)
    is_award_winner = Column(Boolean, default=False)
    is_festive = Column(Boolean, default=False)
    for_men = Column(Boolean, default=False)
    
    ingredient_highlights = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    
    # New relationship for tags (Many-to-Many via product_tags association table)
    # Using string "product_tags" - requires Tag and ProductTag to be imported before mapper is finalized
    tags = relationship("Tag", secondary="product_tags", lazy="select")

