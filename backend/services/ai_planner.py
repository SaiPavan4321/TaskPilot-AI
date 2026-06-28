import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService

class AIPlannerService:
    @classmethod
    def generate_tasks_from_prompt(cls, prompt: str, current_date: str, preferences: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        full_prompt = f"""
        You are an AI Task Planner. The user wants to generate a project or schedule.
        Today's date is: {current_date}
        User's prompt: "{prompt}"
        
        USER PREFERENCES:
        - Daily focus limit: {preferences.get('daily_focus_limit', 4)} hours
        - Weekend working: {preferences.get('weekend_working', False)}
        - Overarching Goal: {preferences.get('goal', 'Improve productivity')}
        - Learning Goal: {preferences.get('learning_goal', 'Learn continuously')}
        
        Break down the request into individual, actionable tasks, respecting their limits and goals.
        Return ONLY valid JSON format. Reject any non-JSON content. Ensure no text before or after the JSON array.
        The JSON must be an array of objects matching this exact structure:
        [
          {{
            "title": "Task title",
            "description": "Short description of the task",
            "deadline": "YYYY-MM-DD",
            "estimated_hours": 2.5,
            "category": "Work",
            "priority": "HIGH" 
          }}
        ]
        
        Valid priorities: "HIGH", "MEDIUM", "LOW"
        Valid categories: "Work", "Personal", "Study", "Health", "Finance", "Other" (or create a relevant one)
        """
        
        try:
            res_str = GeminiService._call_gemini(full_prompt)
            logging.info("Stripping markdown from Gemini response in AI Planner")
            res_str = res_str.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(res_str)
            logging.info(f"Successfully generated {len(parsed)} tasks")
            
            # Ensure proper typing
            for p in parsed:
                p["estimated_hours"] = float(p.get("estimated_hours", 1.0))
                if p.get("priority") not in ["HIGH", "MEDIUM", "LOW"]:
                    p["priority"] = "MEDIUM"
                
            return parsed
        except Exception as e:
            logging.error(f"Failed to parse AI Planner response: {e}")
            import traceback
            traceback.print_exc()
            raise e
