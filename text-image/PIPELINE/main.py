# PIPELINE/main.py
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from PIPELINE.routers import generate
from PIPELINE.dependencies import init_vertexai


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_vertexai()
    yield
    # (Optional) shutdown logic


app = FastAPI(title="Text-to-Image API", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Optional root route so visiting http://127.0.0.1:8000/ doesn’t 404
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """
    Basic heartbeat endpoint.
    """
    return {
        "status": "running",
        "docs": "/docs",
        "image_api": "/api/v1/images/…"
    }

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
