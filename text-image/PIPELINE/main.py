# PIPELINE/main.py
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PIPELINE.routers import generate
from PIPELINE.dependencies import init_vertexai
from PIPELINE.database import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_vertexai()
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()


app = FastAPI(title="Text-to-Image API", lifespan=lifespan)

# ---------------------------------------------------------------------------
# CORS middleware configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Optional root route so visiting http://127.0.0.1:8000/ doesn't 404
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """
    Basic heartbeat endpoint.
    """
    return {
        "status": "running",
        "docs": "/docs",
        "image_api": "/api/v1/images/…",
        "database": "MongoDB connected"
    }

# ---------------------------------------------------------------------------
# History endpoint
# ---------------------------------------------------------------------------
@app.get("/api/v1/history", tags=["History"])
async def get_generation_history():
    """
    Get generation history from MongoDB
    """
    from PIPELINE.database import get_generation_history
    history = await get_generation_history()
    return {"history": history}

# ---------------------------------------------------------------------------
# Image-generation routes (already exist in your project)
# ---------------------------------------------------------------------------
app.include_router(
    generate.router,
    prefix="/api/v1/images",
    tags=["Image Generation"],
)

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "PIPELINE.main:app",
        host="127.0.0.1",   # loopback interface; reachable as localhost
        port=8000,
        reload=True,
        log_level="info",
    )
