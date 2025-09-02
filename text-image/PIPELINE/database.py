import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from datetime import datetime
from typing import Optional

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://aristhrottle:3f484sVzFrDthL9o@userdb.fiqc5.mongodb.net/?retryWrites=true&w=majority&appName=Userdb")
DATABASE_NAME = "text_image_api"
COLLECTION_NAME = "genimage_prompts"

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    database = None
    collection = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    """Create database connection"""
    db_manager.client = AsyncIOMotorClient(MONGODB_URL)
    db_manager.database = db_manager.client[DATABASE_NAME]
    db_manager.collection = db_manager.database[COLLECTION_NAME]
    
    # Test the connection
    try:
        await db_manager.client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    """Close database connection"""
    if db_manager.client:
        db_manager.client.close()
        print("MongoDB connection closed")

async def save_image_generation_record(title: str, tags: list[str], filename: str, generated_prompt: str):
    """Save image generation record to MongoDB"""
    try:
        document = {
            "title": title,
            "tags": tags,
            "filename": filename,
            "generated_prompt": generated_prompt,
            "created_at": datetime.utcnow(),
            "status": "completed"
        }
        
        result = await db_manager.collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as e:
        print(f"Error saving to MongoDB: {e}")
        return None

async def get_generation_history(limit: int = 50):
    """Get generation history from MongoDB"""
    try:
        cursor = db_manager.collection.find().sort("created_at", -1).limit(limit)
        records = []
        async for document in cursor:
            document["_id"] = str(document["_id"])
            records.append(document)
        return records
    except Exception as e:
        print(f"Error fetching from MongoDB: {e}")
        return []
