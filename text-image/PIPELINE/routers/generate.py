
from PIPELINE.dependencies import init_vertexai
from fastapi import APIRouter, HTTPException
from PIPELINE.dependencies import get_genai_client, get_genai_config
from PIPELINE.schemas import ImageRequest
from PIPELINE.database import save_image_generation_record
from fastapi.responses import StreamingResponse
from google.api_core import exceptions
import io

# Save to outputs directory
router = APIRouter()

@router.post("/generate")
async def generate_image(request: ImageRequest):
    try:
        # Generate prompt
        prompt = generate_prompt(request.title, request.tags)
        
        # Generate image
        image = await generate_and_save_image(
            prompt=prompt,
            filename=request.filename
        )
        
        # Save to MongoDB
        record_id = await save_image_generation_record(
            title=request.title,
            tags=request.tags,
            filename=request.filename,
            generated_prompt=prompt
        )
        
        if record_id:
            print(f"Saved generation record with ID: {record_id}")
        
        # Return just the PNG image bytes
        return StreamingResponse(
            io.BytesIO(image._image_bytes),
            media_type="image/png"
        )
        
    except exceptions.GoogleAPIError as e:
        raise HTTPException(500, f"Google API error: {e.message}")
    except Exception as e:
        raise HTTPException(500, f"Processing error: {str(e)}")

def generate_prompt(title: str, tags: list[str]) -> str:
    client = get_genai_client()
    config = get_genai_config()
    
    tags_str = ", ".join(tags)
    prompt_template = f"""
    You are an expert visual‐prompt engineer. Your job is to convert a simple title plus a list of descriptive tags into a rich, coherent, and 
    evocative prompt for a vision model. Be concise, precise, and imaginative.
        
    Title: {title}
    Tags: {tags}
        
    Guidelines:
    1. Capture the core concept implied by the title.
    2. Weave in each tag so that it influences the style, mood, color palette, composition, or atmosphere.
    3. Describe setting, lighting, textures, and any dramatic details.
    4. If appropriate, sprinkle in a brief nod to a genre or artist‐style
    5. Do not exceed 180 words.
        
    **Important Guideline**
    Output only the final image prompt. Do not preface with explanations or anything extra.
        
    Examples:
    • Title: “Desert Wanderer”  
    Tags: “solitary figure, golden dunes, twilight, wind-swept, 8k”  
    → Prompt: “A lone traveler in flowing robes walks across vast golden dunes at twilight; wind-swept sand ripples under a deep purple sky, silhouette backlit by a low sun—evoking epic solitude in 8K detail.”
    Generate the image prompt now.
    """.strip()
    
    response = client.models.generate_content(
        model='gemma-3n-e4b-it',
        contents=prompt_template,
        config=config
    )
    return response.text.strip()

async def generate_and_save_image(prompt: str, filename: str):
    model = init_vertexai()
    response = model.generate_images(
        prompt=prompt,
        number_of_images=1
    )
    
    # Save the image to the specified path
    save_path = f"static/{filename}"
    response.images[0].save(save_path)
    
    # Return the image object instead of URL
    return response.images[0]