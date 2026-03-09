from pydantic import BaseModel, validator

class ProductImageBase(BaseModel):
    image_url: str
    sort_order: int = 0
    is_primary: bool = False

class ProductImageCreate(ProductImageBase):
    @validator('image_url')
    def validate_image_url(cls, v):
        if v.startswith('data:image'):
            raise ValueError('Base64 image uploads are not supported. Use the multipart/form-data upload endpoint.')
        return v

class ProductImage(ProductImageBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True
