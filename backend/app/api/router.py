from fastapi import APIRouter
from app.api.routes import categories, products, product_images

api_router = APIRouter()
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(product_images.router, prefix="/products", tags=["product_images"]) # Nested under /products
