from pydantic import BaseModel
from datetime import datetime
from typing import List

class ImageRequest(BaseModel):
    title: str
    tags: list[str]
    filename: str = "generated_image.png"

class ImageResponse(BaseModel):
    prompt: str
    image_url: str

class GenerationRecord(BaseModel):
    id: str
    title: str
    tags: List[str]
    filename: str
    generated_prompt: str
    created_at: datetime
    status: str

class GenerationHistoryResponse(BaseModel):
    history: List[GenerationRecord]