from fastapi import APIRouter, Depends, HTTPException
import json
from ..models.schemas import AIPlannerRequest, AIChatRequest
from ..services.gemini import GeminiService
from ..auth.routes import get_current_user
from ..database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


from ..services.ai_planner import AIPlannerService
from ..models.schemas import TaskCreate
from typing import List
from ..services.cache_service import AICacheService

@router.post("/planner")
async def generate_tasks(request: AIPlannerRequest, current_user: dict = Depends(get_current_user)):
    try:
        from datetime import datetime
        current_date = datetime.now().strftime("%Y-%m-%d")
        prefs = current_user.get("preferences", {})
        tasks = AIPlannerService.generate_tasks_from_prompt(request.prompt, current_date, prefs)
        return tasks
    except Exception as e:
        import traceback
        logger.error(f"Error in AI Planner: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate tasks")

@router.post("/planner/save")
async def save_planned_tasks(tasks: List[TaskCreate], current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        from datetime import datetime
        tasks_coll = db.get_collection("tasks")
        now = datetime.utcnow().isoformat()
        user_id = str(current_user["_id"])
        
        insert_data = []
        for t in tasks:
            t_dict = t.model_dump()
            t_dict["user_id"] = user_id
            t_dict["created_at"] = now
            insert_data.append(t_dict)
            
        if insert_data:
            await tasks_coll.insert_many(insert_data)
            
        return {"status": "success", "count": len(insert_data)}
    except Exception as e:
        import traceback
        logger.error(f"Error saving tasks: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to save tasks")

from ..services.ai_chat_service import AIChatService

@router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        chat_coll = db.get_collection("chat_history")
        cursor = chat_coll.find({"user_id": str(current_user["_id"])}).sort("timestamp", 1)
        history = await cursor.to_list(length=100)
        
        formatted = []
        for h in history:
            formatted.append({
                "role": h.get("role"),
                "content": h.get("content")
            })
        return formatted
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        return []

@router.post("/chat/history/clear")
async def clear_chat_history(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        chat_coll = db.get_collection("chat_history")
        await chat_coll.delete_many({"user_id": str(current_user["_id"])})
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear history")

@router.post("/chat")
async def chat_assistant(request: AIChatRequest, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        chat_coll = db.get_collection("chat_history")
        tasks_coll = db.get_collection("tasks")
        
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        
        await chat_coll.insert_one({
            "user_id": user_id,
            "role": "user",
            "content": request.message,
            "timestamp": now
        })
        
        cursor = tasks_coll.find({"user_id": user_id})
        tasks = await cursor.to_list(length=200)
        
        hist_cursor = chat_coll.find({"user_id": user_id}).sort("timestamp", -1).limit(10)
        hist_docs = await hist_cursor.to_list(length=10)
        hist_docs.reverse() 
        
        prefs = current_user.get("preferences", {})
        response = AIChatService.generate_reply(request.message, tasks, hist_docs, prefs)
        
        await chat_coll.insert_one({
            "user_id": user_id,
            "role": "ai",
            "content": response,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"reply": response}
    except Exception as e:
        import traceback
        logger.error(f"Error in AI Chat: {e}\n{traceback.format_exc()}")
        return {"reply": "Sorry, I am currently offline or encountered an error."}

from ..services.risk_assessment import RiskAssessmentService
from fastapi import BackgroundTasks

@router.get("/risk-assessment")
async def assess_risk(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        cached_data = await AICacheService.get_ai_cache(db, user_id, "risk-assessment")
        if cached_data:
            return cached_data
            
        tasks_coll = db.get_collection("tasks")
        cursor = tasks_coll.find({"user_id": user_id, "completed": False})
        tasks = await cursor.to_list(length=100)
        
        risks = []
        needs_update = False
        for t in tasks:
            if t.get("risk_percentage") is not None:
                risks.append({
                    "task_id": str(t["_id"]),
                    "title": t.get("title"),
                    "risk_percentage": t.get("risk_percentage"),
                    "risk_level": t.get("risk_level"),
                    "suggestion": t.get("risk_reason"),
                    "best_start_time": t.get("best_start_time")
                })
            else:
                needs_update = True
                
        if needs_update:
            background_tasks.add_task(RiskAssessmentService.update_risks_for_user, str(current_user["_id"]), db)
            
        # Sort by highest risk
        risks.sort(key=lambda x: x.get("risk_percentage", 0), reverse=True)
        await AICacheService.set_ai_cache(db, user_id, "risk-assessment", risks)
        return risks
    except Exception as e:
        import traceback
        logger.error(f"Error in AI Risk Assessment: {e}\n{traceback.format_exc()}")
        return []

from ..services.daily_coach import DailyCoachService
from .analytics import get_dashboard_stats

@router.get("/daily-coach")
async def get_daily_coach(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        
        cached_data = await AICacheService.get_ai_cache(db, user_id, "daily-coach")
        if cached_data:
            return cached_data
            
        tasks_coll = db.get_collection("tasks")
        
        cursor = tasks_coll.find({"user_id": user_id})
        tasks = await cursor.to_list(length=500)
        
        stats = await get_dashboard_stats(current_user, db)
        prefs = current_user.get("preferences", {})
        
        briefing = DailyCoachService.generate_briefing(tasks, stats, current_user.get("name", "User"), prefs)
        await AICacheService.set_ai_cache(db, user_id, "daily-coach", briefing)
        return briefing
    except Exception as e:
        import traceback
        logger.error(f"Error in Daily Coach: {e}\n{traceback.format_exc()}")
        return {
            "greeting": f"Hello {current_user.get('name', 'User').split(' ')[0]}!",
            "summary": "We couldn't generate your daily briefing at this time.",
            "top_task": "None",
            "recommendation": "Check your tasks list to see what's pending.",
            "warning": "Service temporarily unavailable.",
            "motivation": "Stay focused!"
        }

from ..services.habit_intelligence import HabitIntelligenceService

@router.get("/habit-insights")
async def get_habit_insights(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        
        cached_data = await AICacheService.get_ai_cache(db, user_id, "habit-insights")
        if cached_data:
            return cached_data
        
        habits_coll = db.get_collection("habits")
        cursor = habits_coll.find({"user_id": user_id})
        habits = await cursor.to_list(length=100)
        
        stats = await get_dashboard_stats(current_user, db)
        prefs = current_user.get("preferences", {})
        
        insights = HabitIntelligenceService.generate_insights(habits, stats, current_user.get("name", "User"), prefs)
        await AICacheService.set_ai_cache(db, user_id, "habit-insights", insights)
        return insights
    except Exception as e:
        import traceback
        logger.error(f"Error in Habit Insights: {e}\n{traceback.format_exc()}")
        return HabitIntelligenceService._generate_fallback([], current_user.get("name", "User"))

from ..services.weekly_review import WeeklyReviewService

@router.get("/weekly-review")
async def get_weekly_review(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        
        cached_data = await AICacheService.get_ai_cache(db, user_id, "weekly-review")
        if cached_data:
            return cached_data
        
        tasks_coll = db.get_collection("tasks")
        habits_coll = db.get_collection("habits")
        
        t_cursor = tasks_coll.find({"user_id": user_id})
        tasks = await t_cursor.to_list(length=500)
        
        h_cursor = habits_coll.find({"user_id": user_id})
        habits = await h_cursor.to_list(length=100)
        
        stats = await get_dashboard_stats(current_user, db)
        prefs = current_user.get("preferences", {})
        
        review = WeeklyReviewService.generate_review(tasks, habits, stats, current_user.get("name", "User"), prefs)
        await AICacheService.set_ai_cache(db, user_id, "weekly-review", review)
        return review
    except Exception as e:
        import traceback
        logger.error(f"Error in Weekly Review: {e}\n{traceback.format_exc()}")
        return WeeklyReviewService._generate_fallback([], [], {}, current_user.get("name", "User"))

from ..services.productivity_forecast import ProductivityForecastService

@router.get("/productivity-forecast")
async def get_productivity_forecast(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        user_id = str(current_user["_id"])
        
        cached_data = await AICacheService.get_ai_cache(db, user_id, "productivity-forecast")
        if cached_data:
            return cached_data
        
        tasks_coll = db.get_collection("tasks")
        habits_coll = db.get_collection("habits")
        
        t_cursor = tasks_coll.find({"user_id": user_id})
        tasks = await t_cursor.to_list(length=500)
        
        h_cursor = habits_coll.find({"user_id": user_id})
        habits = await h_cursor.to_list(length=100)
        
        stats = await get_dashboard_stats(current_user, db)
        prefs = current_user.get("preferences", {})
        
        # We need risk data for context
        cursor = tasks_coll.find({"user_id": user_id, "completed": False})
        pending = await cursor.to_list(length=100)
        risks = []
        for t in pending:
            if t.get("risk_percentage") is not None:
                risks.append({
                    "title": t.get("title"),
                    "risk_level": t.get("risk_level")
                })
        
        forecast = ProductivityForecastService.generate_forecast(tasks, habits, stats, risks, current_user.get("name", "User"), prefs)
        await AICacheService.set_ai_cache(db, user_id, "productivity-forecast", forecast)
        return forecast
    except Exception as e:
        import traceback
        logger.error(f"Error in Productivity Forecast: {e}\n{traceback.format_exc()}")
        return ProductivityForecastService._generate_fallback([], [], {}, [], current_user.get("name", "User"))

from ..services.gemini_key_manager import key_manager

@router.get("/status")
async def get_ai_status():
    return {
        "available_keys": key_manager.total_keys(),
        "current_key": key_manager.get_current_index() + 1,
        "service": "online" if key_manager.total_keys() > 0 else "offline"
    }
