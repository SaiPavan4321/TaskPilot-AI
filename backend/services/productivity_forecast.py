import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime

class ProductivityForecastService:
    @classmethod
    def generate_forecast(cls, tasks: List[Dict[str, Any]], habits: List[Dict[str, Any]], stats: Dict[str, Any], risks: List[Dict[str, Any]], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
        context = {
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "user_name": user_name,
            "productivity_score": stats.get("productivity_score", 0),
            "completed_tasks": stats.get("completed_tasks", 0),
            "pending_tasks": stats.get("pending_tasks", 0),
            "focus_hours": stats.get("focus_hours", 0),
            "current_streak": stats.get("current_streak", 0),
            "preferences": preferences,
            "tasks": [],
            "habits": [],
            "risks": []
        }
        
        for t in tasks:
            context["tasks"].append({
                "title": t.get("title"),
                "estimated_hours": t.get("estimated_hours", 1),
                "priority": t.get("priority", "MEDIUM"),
                "status": "completed" if t.get("completed") else "pending"
            })

        for h in habits:
            context["habits"].append({
                "name": h.get("name"),
                "streak": h.get("streak", 0)
            })
            
        for r in risks:
            context["risks"].append({
                "title": r.get("title"),
                "risk_level": r.get("risk_level")
            })

        prompt = f"""
You are TaskPilot AI, an expert productivity forecaster.
Analyze the user's workload, history, and habits, and forecast their productivity for the upcoming days.

USER CONTEXT:
{json.dumps(context, indent=2)}

REQUIREMENTS:
1. You MUST return ONLY valid JSON.
2. The JSON must have exactly these keys: 
   - "forecast_score": (integer 0-100) predicted productivity score.
   - "completion_probability": (integer 0-100) chance of finishing pending tasks.
   - "overload_risk": (string) "Low", "Medium", or "High".
   - "predicted_focus_hours": (integer) estimated focus hours needed.
   - "busiest_day": (string) day of week they'll be busiest.
   - "lightest_day": (string) day of week they'll have the least to do.
   - "forecast_summary": (string) a 1-2 sentence summary of the forecast.
   - "recommended_goals": (array of 2-3 strings) smart goals to manage workload.

OUTPUT FORMAT:
{{
  "forecast_score": 85,
  "completion_probability": 90,
  "overload_risk": "Low",
  "predicted_focus_hours": 12,
  "busiest_day": "Tuesday",
  "lightest_day": "Friday",
  "forecast_summary": "...",
  "recommended_goals": ["...", "..."]
}}
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
            logging.error(f"Failed to generate Productivity Forecast: {e}")
            return cls._generate_fallback(tasks, habits, stats, risks, user_name, preferences)

    @classmethod
    def _generate_fallback(cls, tasks: List[Dict[str, Any]], habits: List[Dict[str, Any]], stats: Dict[str, Any], risks: List[Dict[str, Any]], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
        pending_count = stats.get("pending_tasks", 0)
        completed_count = stats.get("completed_tasks", 0)
        
        # Heuristic probability
        if pending_count == 0:
            prob = 100
        else:
            prob = max(10, min(95, int((completed_count / (pending_count + completed_count)) * 100) + stats.get("productivity_score", 0) // 2))

        limit = preferences.get("daily_focus_limit", 4)
        if pending_count > 15 or (pending_count * 2) > (limit * 5) or len([r for r in risks if r.get("risk_level") == "HIGH"]) > 2:
            overload = "High"
            summary = "Your workload is very heavy. You are at high risk of overload."
            goals = ["Prioritize high-risk tasks immediately", "Consider deferring non-urgent work"]
        elif pending_count > 7 or (pending_count * 2) > (limit * 3):
            overload = "Medium"
            summary = "You have a moderate amount of work ahead. Pace yourself."
            goals = ["Knock out quick tasks first", "Maintain your habit streaks"]
        else:
            overload = "Low"
            summary = "Your workload is light and very manageable."
            goals = ["Use extra time to plan ahead", "Focus on deep work sessions"]

        return {
            "forecast_score": prob,
            "completion_probability": prob,
            "overload_risk": overload,
            "predicted_focus_hours": pending_count * 2,
            "busiest_day": "Monday",
            "lightest_day": "Friday",
            "forecast_summary": summary,
            "recommended_goals": goals
        }
