import google.generativeai as genai
from ..config import settings
from .gemini_key_manager import key_manager
import json
import logging
import traceback
from fastapi import HTTPException

logging.basicConfig(level=logging.INFO)

class GeminiService:
    @staticmethod
    def _call_gemini(prompt: str, fallback_response: str = None):
        total_keys = key_manager.total_keys()
        if total_keys == 0:
            if fallback_response:
                return fallback_response
            raise HTTPException(status_code=503, detail="All configured Gemini API keys are temporarily unavailable.")
            
        attempts = 0
        while attempts < total_keys:
            current_key = key_manager.get_current_key()
            current_idx = key_manager.get_current_index() + 1
            
            logging.info(f"Using Gemini API Key #{current_idx}")
            
            try:
                genai.configure(api_key=current_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                logging.info(f"Gemini request successful using Key #{current_idx}")
                return response.text
                
            except Exception as e:
                logging.error(f"Quota exceeded or error on Key #{current_idx}: {e}")
                key_manager.switch_to_next_key()
                attempts += 1
                
        logging.error("All Gemini API keys failed.")
        raise HTTPException(status_code=503, detail="All configured Gemini API keys are temporarily unavailable.")

    @classmethod
    def prioritize_tasks(cls, tasks_json: str):
        prompt = f"""
        You are an AI Productivity Assistant. Analyze the following list of tasks and prioritize them into HIGH, MEDIUM, and LOW priority based on their deadlines, estimated hours, and urgency.
        Return ONLY valid JSON in this format:
        [
          {{"id": "task_id", "title": "task title", "priority": "HIGH", "reason": "brief reason"}}
        ]
        
        Tasks: {tasks_json}
        """
        fallback = """
        [
            {"id": "mock_id", "title": "Mock Task", "priority": "HIGH", "reason": "Mock simulator running because no API key provided."}
        ]
        """
        
        if key_manager.total_keys() == 0:
            # Generate a dynamic fallback based on the actual input tasks
            try:
                tasks = json.loads(tasks_json)
                results = []
                for t in tasks:
                    results.append({
                        "id": str(t.get("_id", "mock_id")),
                        "title": t.get("title", "Task"),
                        "priority": "HIGH" if "urgent" in t.get("title", "").lower() else "MEDIUM",
                        "reason": "AI Simulator prioritized this based on simple heuristics."
                    })
                return json.dumps(results)
            except:
                return fallback

        res = cls._call_gemini(prompt, fallback)
        # Clean markdown codeblocks if any
        res = res.replace("```json", "").replace("```", "").strip()
        return res

    @classmethod
    def generate_schedule(cls, user_prompt: str):
        prompt = f"""
        You are an AI Schedule Generator. The user says: "{user_prompt}"
        Create a day-by-day plan to achieve their goal. 
        Return ONLY valid JSON in this format:
        [
          {{"day": "Day 1", "activities": ["activity 1", "activity 2"]}},
          {{"day": "Day 2", "activities": ["activity 1"]}}
        ]
        """
        fallback = """
        [
          {"day": "Day 1", "activities": ["Simulated Plan Step 1", "Review materials"]},
          {"day": "Day 2", "activities": ["Simulated Plan Step 2", "Practice exercises"]}
        ]
        """
        res = cls._call_gemini(prompt, fallback)
        res = res.replace("```json", "").replace("```", "").strip()
        return res

    @classmethod
    def chat_with_context(cls, message: str, context: str, history: list):
        if key_manager.total_keys() == 0:
            return f"Hello! This is TASKPILOT AI Simulator. You said: '{message}'. To get real AI responses, please add your GEMINI_API_KEY to the .env file."
        
        prompt = f"""You are TASKPILOT AI, a premium productivity coach.
CRITICAL INSTRUCTION: You MUST base your recommendations and analysis strictly on the USER PRODUCTIVITY CONTEXT provided below. Do NOT ask the user for their tasks—they are already provided in the context.
If the user asks "What should I do first?" or "Which task is most urgent?", you MUST explicitly name the highest priority task from the context based on AI Score, Rec. Order, and Deadline.
Keep responses concise, actionable, and formatted nicely in Markdown.
If the user asks general questions unrelated to productivity, answer normally while preserving conversation quality.

=== USER PRODUCTIVITY CONTEXT ===
{context}
=================================

"""
        for h in history:
            role = "AI" if h.get("role") == "model" else "USER"
            # Support both format dicts
            text = h.get("parts", [{"text": ""}])[0].get("text", "") if "parts" in h else h.get("content", "")
            prompt += f"{role}: {text}\n\n"
            
        prompt += f"USER: {message}\nAI: "
        
        try:
            return cls._call_gemini(prompt)
        except Exception as e:
            logging.error(f"Chat failed: {e}")
            return "Sorry, I encountered an error while processing your request."

    @classmethod
    def analyze_risk(cls, tasks_json: str):
        prompt = f"""
        Analyze these tasks for risk of missing deadlines. Calculate a risk percentage.
        Return ONLY valid JSON:
        [
          {{"id": "task_id", "title": "Task name", "risk_percentage": 85, "suggestion": "Start immediately."}}
        ]
        Tasks: {tasks_json}
        """
        if key_manager.total_keys() == 0:
            try:
                tasks = json.loads(tasks_json)
                results = []
                for t in tasks:
                    results.append({
                        "id": str(t.get("_id", "mock_id")),
                        "title": t.get("title", "Task"),
                        "risk_percentage": 45,
                        "suggestion": "Keep track of this task. (Simulator fallback)"
                    })
                return json.dumps(results)
            except:
                pass
        
        fallback = "[]"
        res = cls._call_gemini(prompt, fallback)
        res = res.replace("```json", "").replace("```", "").strip()
        return res
