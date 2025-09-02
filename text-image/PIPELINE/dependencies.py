import os
from dotenv import load_dotenv
from google.oauth2 import service_account
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from google import genai
from google.genai import types

load_dotenv()

# MongoDB URL (can be overridden in .env file)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://aristhrottle:3f484sVzFrDthL9o@userdb.fiqc5.mongodb.net/?retryWrites=true&w=majority&appName=Userdb")

# Vertex AI initialization
def init_vertexai():
    credentials = service_account.Credentials.from_service_account_file(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
    vertexai.init(
        project=os.getenv("PROJECT_ID"),
        location=os.getenv("LOCATION"),
        credentials=credentials
    )
    return ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")

# GenAI client setup
def get_genai_client():
    return genai.Client(api_key=os.getenv("GENAI_API_KEY"))

# Content generation config
def get_genai_config():
    return types.GenerateContentConfig(
        temperature=0.7,
        max_output_tokens=300,
        top_p=0.9,
        top_k=40
    )