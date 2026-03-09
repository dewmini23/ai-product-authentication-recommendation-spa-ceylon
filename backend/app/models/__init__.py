from app.db.session import Base
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag, ProductTag       # Must be before Product
from app.models.product import Product           # Needs product_tags from above
from app.models.product_image import ProductImage
from app.models.product_auth_reference import ProductAuthReference


__all__ = ["Base", "Category", "Product", "ProductImage", "Tag", "ProductTag", "ProductAuthReference"]
