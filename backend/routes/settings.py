from fastapi import APIRouter, Depends, HTTPException
from ..auth.routes import get_current_user
from ..models.schemas import UserProfile
from ..database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_profile_settings(settings_data: dict, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    users = db.get_collection("users")
    
    update_doc = {}
    
    top_level_fields = ["name", "picture", "bio", "notifications", "dark_mode", "language"]
    for key in top_level_fields:
        if key in settings_data:
            update_doc[key] = settings_data[key]
            
    if "preferences" in settings_data and isinstance(settings_data["preferences"], dict):
        existing_prefs = current_user.get("preferences") or {}
        new_prefs = {**existing_prefs, **settings_data["preferences"]}
        update_doc["preferences"] = new_prefs
        
    if update_doc:
        await users.update_one({"_id": current_user["_id"]}, {"$set": update_doc})
        
    updated_user = await users.find_one({"_id": current_user["_id"]})
    return updated_user
