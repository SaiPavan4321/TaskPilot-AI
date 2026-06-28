from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.schemas import HabitCreate, HabitResponse
from ..auth.routes import get_current_user
from ..database import get_db
from datetime import datetime
from ..services.cache_service import AICacheService

router = APIRouter(prefix="/habits", tags=["habits"])

@router.get("", response_model=List[HabitResponse])
async def get_habits(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    habits_coll = db.get_collection("habits")
    cursor = habits_coll.find({"user_id": str(current_user["_id"])})
    habits = await cursor.to_list(length=100)
    return habits

@router.post("", response_model=HabitResponse)
async def create_habit(habit: HabitCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    habits_coll = db.get_collection("habits")
    habit_dict = habit.model_dump()
    habit_dict["user_id"] = str(current_user["_id"])
    habit_dict["streak"] = 0
    habit_dict["completions"] = []
    
    res = await habits_coll.insert_one(habit_dict)
    habit_dict["_id"] = str(res.inserted_id)
    await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
    return habit_dict

@router.post("/{habit_id}/checkin", response_model=HabitResponse)
async def checkin_habit(habit_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        from bson import ObjectId
        import traceback
        
        try:
            if isinstance(habit_id, ObjectId):
                obj_id = habit_id
            else:
                obj_id = ObjectId(habit_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid habit ID")
            
        user_id_str = str(current_user["_id"])
        query = {"_id": obj_id, "user_id": user_id_str}
        
        habits_coll = db.get_collection("habits")
        habit = await habits_coll.find_one(query)
        
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
            
        completions = habit.get("completions")
        if completions is None or not isinstance(completions, list):
            completions = []
        
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        streak = habit.get("streak")
        if streak is None or not isinstance(streak, int):
            streak = 0
            
        if today in completions:
            habit["_id"] = str(habit["_id"])
            return habit
            
        completions.append(today)
        streak += 1
        
        update_doc = {"$set": {"completions": completions, "streak": streak}}
        await habits_coll.update_one({"_id": obj_id, "user_id": user_id_str}, update_doc)
        
        updated_habit = await habits_coll.find_one({"_id": obj_id, "user_id": user_id_str})
        
        if updated_habit:
            updated_habit["_id"] = str(updated_habit["_id"])
        await AICacheService.invalidate_ai_cache(db, user_id_str)
        return updated_habit
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking in habit: {e}\n{traceback.format_exc()}")
        raise

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from bson import ObjectId
    try:
        obj_id = ObjectId(habit_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid habit ID")
        
    habits_coll = db.get_collection("habits")
    result = await habits_coll.delete_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
    return {"message": "Habit deleted"}
