import os
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

import certifi
import logging

logger = logging.getLogger(__name__)

db_client = None
db = None

async def init_db():
    global db_client, db
    
    if not settings.mongo_url:
        raise ValueError("CRITICAL: MONGO_URL environment variable is missing. Cannot connect to MongoDB Atlas.")
        
    logger.info(f"Attempting to connect to MongoDB Atlas...")
    
    # Do not silently catch exceptions here. Let it crash so Docker logs the full stack trace.
    db_client = AsyncIOMotorClient(
        settings.mongo_url, 
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where()
    )
    
    # Force a ping to immediately verify the connection (will raise ServerSelectionTimeoutError if failed)
    await db_client.admin.command('ping') 
    
    # Extract database name or default to 'taskpilot'
    db_name = settings.mongo_url.split('/')[-1].split('?')[0]
    if not db_name or db_name == 'mongodb+srv:':
        db_name = 'taskpilot'
        
    db = db_client[db_name]
    
    logger.info("=========================================")
    logger.info("✅ Connected to MongoDB Atlas")
    logger.info(f"✅ Database name: {db_name}")
    logger.info("✅ Active storage backend: MongoDB Atlas (Motor)")
    logger.info("=========================================")

def get_db():
    if db is None:
        raise RuntimeError("Database not initialized.")
    return db
