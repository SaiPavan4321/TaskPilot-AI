import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime

class HabitIntelligenceService:
    @classmethod
    def generate_insights(cls, habits: List[Dict[str, Any]], stats: Dict[str, Any], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
        if not habits:
            return cls._generate_empty_state(user_name)
            
        context = {
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "user_name": user_name,
            "productivity_score": stats.get("productivity_score", 0),
            "completed_tasks": stats.get("completed_tasks", 0),
            "pending_tasks": stats.get("pending_tasks", 0),
            "focus_hours": stats.get("focus_hours", 0),
            "preferences": preferences,
            "habits": []
        }
        
        for h in habits:
            context["habits"].append({
                "name": h.get("name"),
                "category": h.get("category"),
                "streak": h.get("streak", 0),
                "total_completions": len(h.get("completions", []))
            })
            
        prompt = f"""
You are TaskPilot AI, an expert habit and productivity coach.
Analyze the following user context and generate personalized habit insights.

USER CONTEXT:
{json.dumps(context, indent=2)}

REQUIREMENTS:
1. You MUST return ONLY valid JSON.
2. The JSON must have exactly these keys: "overall_habit_score", "best_habit", "weakest_habit", "insights", "recommendations", "motivation".
3. "overall_habit_score": (integer 0-100) based on streaks and task completion.
4. "best_habit": (string) the name of their strongest habit, or "None" if none are good.
5. "weakest_habit": (string) the name of the habit needing most work, or "None".
6. "insights": (array of 2 strings) deep observations connecting their habits and productivity.
7. "recommendations": (array of 2 strings) actionable advice to improve weak habits or leverage strong ones.
8. "motivation": (string) a short motivational quote or phrase.

OUTPUT FORMAT:
{{
  "overall_habit_score": 0,
  "best_habit": "...",
  "weakest_habit": "...",
  "insights": ["...", "..."],
  "recommendations": ["...", "..."],
  "motivation": "..."
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
            logging.error(f"Failed to generate Habit Insights: {e}")
            return cls._generate_fallback(habits, user_name)

    @classmethod
    def _generate_empty_state(cls, user_name: str) -> Dict[str, Any]:
        return {
            "overall_habit_score": 0,
            "best_habit": "None",
            "weakest_habit": "None",
            "insights": [
                "You haven't tracked any habits yet.",
                "Building small daily habits is the foundation of long-term productivity."
            ],
            "recommendations": [
                "Start small: Try adding a 5-minute daily habit.",
                "Link a new habit to an existing routine."
            ],
            "motivation": "The secret of your future is hidden in your daily routine."
        }
        
    @classmethod
    def _generate_fallback(cls, habits: List[Dict[str, Any]], user_name: str) -> Dict[str, Any]:
        if not habits:
            return cls._generate_empty_state(user_name)
            
        habits.sort(key=lambda x: x.get("streak", 0), reverse=True)
        best = habits[0]
        weakest = habits[-1] if len(habits) > 1 else habits[0]
        
        avg_streak = sum(h.get("streak", 0) for h in habits) / len(habits)
        score = min(100, int((avg_streak / 7) * 100)) # assume 7 day streak is 100%
        if score == 0:
            score = 10
            
        return {
            "overall_habit_score": score,
            "best_habit": best.get("name"),
            "weakest_habit": weakest.get("name"),
            "insights": [
                f"You're doing great with '{best.get('name')}'.",
                "Keep building your streaks to increase your habit score."
            ],
            "recommendations": [
                f"Try to focus a bit more on '{weakest.get('name')}'.",
                "Consistency is key."
            ],
            "motivation": "Small disciplines repeated with consistency every day lead to great achievements."
        }
