from pydantic import BaseModel

class ProductImageBase(BaseModel):
    image_url: str
    sort_order: int = 0
    is_primary: bool = False

class ProductImageCreate(ProductImageBase):
    pass

class ProductImage(ProductImageBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True
