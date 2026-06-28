import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService
from datetime import datetime

class AIChatService:
    @classmethod
    def build_context(cls, tasks: List[Dict[str, Any]], preferences: Dict[str, Any] = {}) -> str:
        """
        Builds a comprehensive context string based on the user's productivity data.
        """
        pending = [t for t in tasks if not t.get("completed", False)]
        completed = [t for t in tasks if t.get("completed", False)]
        
        # Sort pending by deadline if possible
        def get_deadline(t):
            d = t.get("deadline")
            return d if d else "9999-12-31"
        pending.sort(key=get_deadline)
        
        # Calculate metrics
        total = len(tasks)
        completion_pct = round(len(completed) / total * 100) if total > 0 else 0
        productivity_score = min(100, len(completed) * 10)  # Dummy heuristic for now unless habits are passed
        
        context_parts = []
        context_parts.append(f"Today's date is: {datetime.now().strftime('%Y-%m-%d')}.")
        context_parts.append(f"User Metrics: {completion_pct}% completion rate, {len(pending)} pending tasks, {len(completed)} completed tasks.")
        context_parts.append(f"Productivity Score: {productivity_score}/100.")
        context_parts.append(f"AI Personality you must adopt: {preferences.get('ai_personality', 'Professional Coach')}.")
        context_parts.append(f"User Goal: {preferences.get('goal', 'None')}")
        
        if pending:
            context_parts.append("\nPENDING TASKS (Ordered by deadline):")
            for t in pending:
                context_parts.append(
                    f"- '{t.get('title')}' "
                    f"[Deadline: {t.get('deadline', 'None')}, "
                    f"Priority: {t.get('priority', 'MEDIUM')}, "
                    f"Est Hours: {t.get('estimated_hours', 1)}, "
                    f"Category: {t.get('category', 'None')}]"
                )
                if t.get('ai_score'):
                    context_parts[-1] += f" (AI Score: {t['ai_score']})"
                if t.get('recommended_order') is not None:
                    context_parts[-1] += f" (Rec. Order: {t['recommended_order']})"
                    
        if completed:
            context_parts.append(f"\nCOMPLETED TASKS ({len(completed)} total):")
            for t in completed[-5:]:  # Last 5 completed
                context_parts.append(f"- '{t.get('title')}'")
        
        return "\n".join(context_parts)

    @classmethod
    def generate_reply(cls, message: str, tasks: List[Dict[str, Any]], history: List[Dict[str, Any]], preferences: Dict[str, Any] = {}) -> str:
        context = cls.build_context(tasks, preferences)
        return GeminiService.chat_with_context(message, context, history)
