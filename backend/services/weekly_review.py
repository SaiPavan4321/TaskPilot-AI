import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime

class WeeklyReviewService:
    @classmethod
    def generate_review(cls, tasks: List[Dict[str, Any]], habits: List[Dict[str, Any]], stats: Dict[str, Any], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
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
            "habits": []
        }
        
        for t in tasks:
            context["tasks"].append({
                "title": t.get("title"),
                "category": t.get("category"),
                "status": "completed" if t.get("completed") else "pending"
            })

        for h in habits:
            context["habits"].append({
                "name": h.get("name"),
                "streak": h.get("streak", 0),
                "category": h.get("category")
            })
            
        prompt = f"""
You are TaskPilot AI, an expert productivity coach.
Analyze the user's weekly context (tasks, habits, stats) and generate a comprehensive weekly performance review.

USER CONTEXT:
{json.dumps(context, indent=2)}

REQUIREMENTS:
1. You MUST return ONLY valid JSON.
2. The JSON must have exactly these keys: 
   - "overall_score": (integer 0-100) reflecting their weekly performance.
   - "summary": (string) a high-level summary of their week.
   - "strengths": (array of 2 strings) things they did well.
   - "weaknesses": (array of 2 strings) areas where they struggled or neglected.
   - "patterns": (array of 2 strings) observations about their categories or habits.
   - "recommendations": (array of 2 strings) actionable advice for next week.
   - "next_week_goal": (string) one main overarching goal they should set for next week.

OUTPUT FORMAT:
{{
  "overall_score": 0,
  "summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "patterns": ["...", "..."],
  "recommendations": ["...", "..."],
  "next_week_goal": "..."
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
            logging.error(f"Failed to generate Weekly Review: {e}")
            return cls._generate_fallback(tasks, habits, stats, user_name, preferences)

    @classmethod
    def _generate_fallback(cls, tasks: List[Dict[str, Any]], habits: List[Dict[str, Any]], stats: Dict[str, Any], user_name: str, preferences: Dict[str, Any] = {}) -> Dict[str, Any]:
        completed_tasks = stats.get("completed_tasks", 0)
        pending_tasks = stats.get("pending_tasks", 0)
        
        total_tasks = completed_tasks + pending_tasks
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        score = int((completion_rate + stats.get("productivity_score", 0)) / 2)
        if total_tasks == 0 and not habits:
            score = 0
            summary = "It looks like you didn't have any tasks or habits this week. Let's start fresh!"
            strengths = ["Ready for a fresh start"]
            weaknesses = ["No tasks logged", "No habits tracked"]
            patterns = ["Inactivity"]
            recommendations = ["Add 3 important tasks for the week", "Start tracking one simple daily habit"]
            goal = "Plan the week ahead"
        else:
            summary = f"You completed {completed_tasks} tasks and maintained a {stats.get('current_streak', 0)}-day streak."
            strengths = [f"Completed {completed_tasks} tasks", f"Logged {stats.get('focus_hours', 0)} focus hours"]
            weaknesses = ["Some pending tasks rolled over", "Habit consistency could be improved"]
            patterns = ["Most tasks fall into your standard categories"]
            recommendations = ["Prioritize high-risk tasks early in the week", "Try to keep your habit streak alive"]
            goal = "Clear out pending tasks and maintain daily check-ins"

        return {
            "overall_score": score,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "patterns": patterns,
            "recommendations": recommendations,
            "next_week_goal": goal
        }
