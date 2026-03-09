from typing import List, Optional
from pydantic import BaseModel

# Base
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    tag_type: str  # Required parameter now

# Response
class TagOut(TagBase):
    id: int
    tag_type: str

class TagInput(BaseModel):
    name: str
    tag_type: str

class ReplaceTagsIn(BaseModel):
    tags: List[TagInput]
