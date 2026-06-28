from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, List, Any, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

# Auth Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserPreferences(BaseModel):
    timezone: Optional[str] = "UTC"
    wake_time: Optional[str] = "08:00"
    sleep_time: Optional[str] = "23:00"
    preferred_work_session: Optional[int] = 60
    daily_focus_limit: Optional[int] = 4
    break_interval: Optional[int] = 15
    weekend_working: Optional[bool] = False
    goal: Optional[str] = "Improve productivity"
    learning_goal: Optional[str] = "Learn continuously"
    stress_level: Optional[str] = "Medium"
    ai_personality: Optional[str] = "Professional Coach"
    reminder_style: Optional[str] = "Gentle"
    notification_preferences: Optional[bool] = True

class UserProfile(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    email: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    notifications: Optional[bool] = True
    dark_mode: Optional[bool] = False
    language: Optional[str] = "en"
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)
    
    class Config:
        populate_by_name = True

# Task Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    deadline: str # ISO string
    estimated_hours: float
    category: str
    priority: str = "Medium" # High, Medium, Low
    completed: bool = False
    priority_reason: Optional[str] = None
    ai_score: Optional[int] = None
    recommended_order: Optional[int] = None
    risk_percentage: Optional[int] = None
    risk_level: Optional[str] = None
    risk_reason: Optional[str] = None
    best_start_time: Optional[str] = None
    risk_updated_at: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    estimated_hours: Optional[float] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    priority_reason: Optional[str] = None
    ai_score: Optional[int] = None
    recommended_order: Optional[int] = None
    risk_percentage: Optional[int] = None
    risk_level: Optional[str] = None
    risk_reason: Optional[str] = None
    best_start_time: Optional[str] = None
    risk_updated_at: Optional[str] = None

class TaskResponse(TaskBase):
    id: PyObjectId = Field(alias="_id")
    user_id: str
    created_at: str

    class Config:
        populate_by_name = True

# Habit Models
class HabitBase(BaseModel):
    name: str
    category: str # Coding, Reading, Exercise, Meditation
    target_days: int = 7

class HabitCreate(HabitBase):
    pass

class HabitResponse(HabitBase):
    id: PyObjectId = Field(alias="_id")
    user_id: str
    streak: int = 0
    completions: List[str] = [] # List of date strings
    
    class Config:
        populate_by_name = True

# AI Models
class AIPlannerRequest(BaseModel):
    prompt: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
