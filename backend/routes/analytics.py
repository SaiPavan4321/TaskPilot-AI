from fastapi import APIRouter, Depends
from ..auth.routes import get_current_user
from ..database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        tasks_coll = db.get_collection("tasks")
        habits_coll = db.get_collection("habits")
        user_id = str(current_user["_id"])
        
        cursor = tasks_coll.find({"user_id": user_id})
        all_tasks = await cursor.to_list(length=500)
        
        habit_cursor = habits_coll.find({"user_id": user_id})
        all_habits = await habit_cursor.to_list(length=100)
        
        current_streak = max([h.get("streak", 0) for h in all_habits]) if all_habits else 0
        
        total = len(all_tasks)
        completed = len([t for t in all_tasks if t.get("completed")])
        pending = total - completed
        
        productivity_score = int((completed / total * 100)) if total > 0 else 0
        
        focus_hours = 0
        weekly_hours = {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0}
        
        from datetime import datetime
        for t in all_tasks:
            if t.get("completed"):
                hours = 0
                try:
                    hours = float(t.get("estimated_hours", 0))
                except (ValueError, TypeError):
                    pass
                focus_hours += hours
                
                # Assign to day based on deadline or created_at
                date_str = t.get("deadline") or t.get("created_at")
                if date_str:
                    try:
                        # try parse YYYY-MM-DD
                        dt = datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
                        day_name = dt.strftime("%a")
                        if day_name in weekly_hours:
                            weekly_hours[day_name] += hours
                    except Exception:
                        pass

        weekly_data = [{"day": k, "hours": v} for k, v in weekly_hours.items()]
        
        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "productivity_score": productivity_score,
            "focus_hours": focus_hours,
            "current_streak": current_streak,
            "weekly_data": weekly_data
        }
    except Exception as e:
        import traceback
        logger.error(f"Error generating dashboard analytics: {e}\n{traceback.format_exc()}")
        return {
            "total_tasks": 0, "completed_tasks": 0, "pending_tasks": 0,
            "productivity_score": 0, "focus_hours": 0, "current_streak": 0,
            "weekly_data": []
        }
