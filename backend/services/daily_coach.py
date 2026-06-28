import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime

class DailyCoachService:
    @classmethod
    def generate_briefing(cls, tasks: List[Dict[str, Any]], stats: Dict[str, Any], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Generates a structured daily briefing based on tasks and dashboard stats.
        """
        pending = [t for t in tasks if not t.get("completed", False)]
        completed = [t for t in tasks if t.get("completed", False)]
        
        # Determine top task via recommended_order or priority
        pending.sort(key=lambda x: x.get("recommended_order") if x.get("recommended_order") is not None else 9999)
        top_task = pending[0] if pending else None
        
        # Build prompt context
        context = {
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "user_name": user_name,
            "pending_count": len(pending),
            "completed_count": len(completed),
            "productivity_score": stats.get("productivity_score", 0),
            "focus_hours": stats.get("focus_hours", 0),
            "current_streak": stats.get("current_streak", 0),
            "preferences": preferences,
            "top_task": top_task.get("title") if top_task else None,
            "tasks_summary": [
                {
                    "title": t.get("title"),
                    "priority": t.get("priority"),
                    "deadline": t.get("deadline"),
                    "estimated_hours": t.get("estimated_hours"),
                    "ai_score": t.get("ai_score")
                } for t in pending[:5]  # Limit to top 5 pending
            ]
        }
        
        prompt = f"""
You are TaskPilot AI, an expert productivity coach.
Analyze the following user context and generate a daily briefing.

USER CONTEXT:
{json.dumps(context, indent=2)}

REQUIREMENTS:
1. You MUST return ONLY valid JSON.
2. The JSON must have exactly these keys: "greeting", "summary", "top_task", "recommendation", "warning", "motivation".
3. "greeting": A short, personalized morning/daily greeting using the user's name.
4. "summary": A 1-2 sentence overview of their day and productivity score/streak. If pending_count is 0, congratulate them.
5. "top_task": The specific title of the task they should do first (from the tasks_summary), or "None" if caught up.
6. "recommendation": Actionable advice on how to tackle their top task or day.
7. "warning": A 1 sentence warning if any tasks are high priority/overdue. Set to null if there are no risks.
8. "motivation": A short, powerful motivational quote or phrase.

OUTPUT FORMAT:
{{
  "greeting": "...",
  "summary": "...",
  "top_task": "...",
  "recommendation": "...",
  "warning": "...",
  "motivation": "..."
}}
"""
        
        try:
            response = GeminiService._call_gemini(prompt)
            # Remove markdown JSON wrappers if present
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:-3]
            elif clean_response.startswith("```"):
                clean_response = clean_response[3:-3]
                
            return json.loads(clean_response)
        except Exception as e:
            logging.error(f"Failed to generate AI Coach Briefing: {e}")
            return cls._generate_fallback(context)

    @classmethod
    def _generate_fallback(cls, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Intelligent local fallback if Gemini fails.
        """
        name = context.get("user_name", "there")
        pending_count = context.get("pending_count", 0)
        top_task = context.get("top_task")
        
        if pending_count == 0:
            return {
                "greeting": f"Hello {name}!",
                "summary": "You are completely caught up for today.",
                "top_task": "None",
                "recommendation": "Take a break, learn something new, or plan for tomorrow.",
                "warning": None,
                "motivation": "Rest is just as important as work."
            }
            
        return {
            "greeting": f"Hello {name}!",
            "summary": f"You have {pending_count} tasks left today.",
            "top_task": top_task or "Your next task",
            "recommendation": f"I recommend starting with '{top_task or 'your highest priority task'}' right now to build momentum.",
            "warning": "AI generation is currently offline, but you still have tasks to complete.",
            "motivation": "Consistency builds success."
        }
