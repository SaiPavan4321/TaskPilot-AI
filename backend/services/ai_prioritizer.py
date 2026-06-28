import json
import logging
from typing import List, Dict, Any
from .gemini import GeminiService

class AIPrioritizerService:
    @classmethod
    def prioritize_tasks(cls, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not tasks:
            return []
            
        clean_tasks = []
        for t in tasks:
            clean_tasks.append({
                "id": str(t.get("_id", t.get("id"))),
                "title": t.get("title", ""),
                "deadline": t.get("deadline", ""),
                "estimated_hours": t.get("estimated_hours", 0),
                "category": t.get("category", ""),
                "priority": t.get("priority", "Medium")
            })
            
        tasks_json = json.dumps(clean_tasks)
        
        prompt = f"""
        You are an AI Productivity Assistant. Analyze the following list of pending tasks and prioritize them.
        Consider their deadlines, estimated hours, category, and overall urgency.
        Return ONLY valid JSON. Reject any non-JSON content. Format:
        [
          {{"id": "task_id", "priority": "HIGH", "priority_reason": "Short explanation", "ai_score": 95, "recommended_order": 1}}
        ]
        
        Tasks: {tasks_json}
        """
        
        try:
            res_str = GeminiService._call_gemini(prompt)
            logging.info(f"Stripping markdown from Gemini response")
            res_str = res_str.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(res_str)
            logging.info(f"Successfully parsed AI response: {parsed}")
            return parsed
        except Exception as e:
            logging.error(f"Failed to parse AI Prioritize response: {e}")
            import traceback
            traceback.print_exc()
            raise e

    @classmethod
    def _generate_fallback(cls, tasks: List[Dict[str, Any]]) -> str:
        results = []
        for i, t in enumerate(tasks):
            results.append({
                "id": t.get("id"),
                "priority": t.get("priority", "Medium"),
                "priority_reason": "AI Simulator assigned default prioritization.",
                "ai_score": max(10, 100 - (i * 10)),
                "recommended_order": i + 1
            })
        return json.dumps(results)
