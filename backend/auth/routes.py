from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
import json

from .security import get_password_hash, verify_password, create_access_token, decode_access_token
from ..models.schemas import UserCreate, UserLogin, UserProfile, Token
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    from bson import ObjectId
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise credentials_exception
        
    users = db.get_collection("users")
    user = await users.find_one({"_id": obj_id})
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db=Depends(get_db)):
    users = db.get_collection("users")
    existing_user = await users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
        
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict["password"] = hashed_password
    
    res = await users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": str(res.inserted_id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    users = db.get_collection("users")
    user = await users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_login(data: dict, db=Depends(get_db)):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
        
    from google.oauth2 import id_token
    from google.auth.transport import requests
    from ..config import settings
    
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.google_client_id
        )
        
        email = idinfo.get("email")
        name = idinfo.get("name")
        picture = idinfo.get("picture")
        
        if not email:
            raise ValueError("Token didn't contain an email")
            
        users = db.get_collection("users")
        user = await users.find_one({"email": email})
        
        if not user:
            # Create user without password (OAuth)
            user_dict = {
                "email": email, 
                "name": name or email.split("@")[0], 
                "password": "OAUTH_USER",
                "picture": picture
            }
            res = await users.insert_one(user_dict)
            user_id = str(res.inserted_id)
        else:
            user_id = str(user["_id"])
            # Update picture if missing or changed
            if picture and user.get("picture") != picture:
                await users.update_one({"_id": user["_id"]}, {"$set": {"picture": picture}})
            
        access_token = create_access_token(data={"sub": user_id})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to verify Google token")

@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_profile(user_update: dict, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    users = db.get_collection("users")
    update_data = {}
    allowed_fields = ["name", "picture", "bio", "notifications", "dark_mode", "language"]
    
    for key in allowed_fields:
        if key in user_update:
            update_data[key] = user_update[key]
            
    if update_data:
        await users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        
    updated_user = await users.find_one({"_id": current_user["_id"]})
    return updated_user
