from pydantic import BaseModel

class ImageRequest(BaseModel):
    title: str
    tags: list[str]
    filename: str = "generated_image.png"

class ImageResponse(BaseModel):
    prompt: str
    image_url: str