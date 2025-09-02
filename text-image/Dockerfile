# Use Python 3.11 slim image as base
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p static
RUN mkdir -p PIPELINE/routers

# Copy the application code
COPY PIPELINE/ ./PIPELINE/
COPY static/ ./static/

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "PIPELINE.main:app", "--host", "0.0.0.0", "--port", "8000"] 