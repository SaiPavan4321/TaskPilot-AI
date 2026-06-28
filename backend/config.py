import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load from ../.env if running locally
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

class Settings(BaseSettings):
    mongo_url: str = os.getenv("MONGO_URL", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "supersecretjwtkey123456!@#")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 7 days
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
