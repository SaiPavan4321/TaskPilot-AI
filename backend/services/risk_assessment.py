import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime
from bson import ObjectId

class RiskAssessmentService:
    @classmethod
    def assess_risk(cls, tasks: List[Dict[str, Any]], preferences: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """
        Evaluates the risk of missing deadlines for all pending tasks.
        Returns a list of risk objects for each task.
        """
        pending = [t for t in tasks if not t.get("completed", False)]
        if not pending:
            return []
            
        context = {
            "current_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "preferences": preferences,
            "tasks": []
        }
        
        for t in pending:
            context["tasks"].append({
                "task_id": str(t.get("_id") or t.get("id")),
                "title": t.get("title"),
                "deadline": t.get("deadline"),
                "estimated_hours": t.get("estimated_hours"),
                "ai_priority": t.get("priority"),
                "ai_score": t.get("ai_score"),
                "recommended_order": t.get("recommended_order")
            })
            
        prompt = f"""
You are TaskPilot AI, an expert productivity and risk assessment engine.
Analyze the following pending tasks and predict the likelihood of missing their deadlines.

CONTEXT:
{json.dumps(context, indent=2)}

REQUIREMENTS:
1. You MUST return ONLY valid JSON representing a list of objects.
2. Output an array where each object has EXACTLY these keys:
   - "task_id": (string) matching the input
   - "risk_percentage": (integer 0-100) higher means more likely to miss deadline
   - "risk_level": (string) one of "Low", "Medium", "High", "Critical"
   - "reason": (string) 1 sentence explaining the risk
   - "suggestion": (string) 1 sentence actionable advice to mitigate risk
   - "best_start_time": (string) A suggested date/time or period (e.g., "Today afternoon", "Tomorrow morning")

OUTPUT FORMAT:
[
  {{
    "task_id": "...",
    "risk_percentage": 0,
    "risk_level": "...",
    "reason": "...",
    "suggestion": "...",
    "best_start_time": "..."
  }}
]
"""
        try:
            response = GeminiService._call_gemini(prompt)
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:-3]
            elif clean_response.startswith("```"):
                clean_response = clean_response[3:-3]
                
            return json.loads(clean_response)
        except Exception as e:
            logging.error(f"Risk Assessment AI failed: {e}")
            return cls._generate_fallback(pending)

    @classmethod
    def _generate_fallback(cls, pending_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        fallback = []
        now = datetime.now()
        for t in pending_tasks:
            deadline_str = t.get("deadline")
            est_hours = t.get("estimated_hours", 1)
            risk_pct = 0
            level = "Low"
            
            if deadline_str:
                try:
                    dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                    diff = (dt.replace(tzinfo=None) - now).total_seconds() / 3600 # hours
                    
                    if diff < 0:
                        risk_pct = 100
                        level = "Critical"
                    elif diff < float(est_hours) * 1.5:
                        risk_pct = 90
                        level = "Critical"
                    elif diff < float(est_hours) * 3:
                        risk_pct = 70
                        level = "High"
                    elif diff < 24:
                        risk_pct = 50
                        level = "Medium"
                    else:
                        risk_pct = 20
                except:
                    risk_pct = 10
            else:
                risk_pct = 5
                
            fallback.append({
                "task_id": str(t.get("_id") or t.get("id")),
                "risk_percentage": risk_pct,
                "risk_level": level,
                "reason": "Fallback local assessment based on deadline proximity.",
                "suggestion": "Review deadline and ensure you have enough time.",
                "best_start_time": "As soon as possible"
            })
        return fallback

    @classmethod
    async def update_risks_for_user(cls, user_id: str, db):
        try:
            users_coll = db.get_collection("users")
            user = await users_coll.find_one({"_id": ObjectId(user_id)})
            prefs = user.get("preferences", {}) if user else {}
            
            tasks_coll = db.get_collection("tasks")
            cursor = tasks_coll.find({"user_id": user_id, "completed": False})
            tasks = await cursor.to_list(length=100)
            
            if not tasks:
                return
                
            risks = cls.assess_risk(tasks, prefs)
            now_iso = datetime.utcnow().isoformat()
            
            from pymongo import UpdateOne
            bulk_ops = []
            
            for r in risks:
                task_id = r.get("task_id")
                if not task_id:
                    continue
                try:
                    obj_id = ObjectId(task_id)
                    update_data = {
                        "risk_percentage": r.get("risk_percentage"),
                        "risk_level": r.get("risk_level"),
                        "risk_reason": r.get("reason"),
                        "best_start_time": r.get("best_start_time"),
                        "risk_updated_at": now_iso
                    }
                    bulk_ops.append(UpdateOne({"_id": obj_id, "user_id": user_id}, {"$set": update_data}))
                except:
                    pass
                    
            if bulk_ops:
                await tasks_coll.bulk_write(bulk_ops)
                
        except Exception as e:
            logging.error(f"Background risk update failed: {e}")
