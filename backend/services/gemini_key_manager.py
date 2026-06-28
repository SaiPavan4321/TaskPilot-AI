import os
import logging
from typing import List

# Ensure dotenv is loaded by importing settings if necessary
from ..config import settings

class GeminiKeyManager:
    def __init__(self):
        self.keys: List[str] = []
        self.current_index = 0
        self._load_keys()
        
    def _load_keys(self):
        # Scan environment for GEMINI_API_KEY*
        for key, value in os.environ.items():
            if key.startswith("GEMINI_API_KEY") and value.strip():
                if value.strip() not in self.keys:
                    self.keys.append(value.strip())
        
    def get_current_key(self) -> str:
        if not self.keys:
            return None
        return self.keys[self.current_index]
        
    def get_current_index(self) -> int:
        return self.current_index
        
    def switch_to_next_key(self):
        if not self.keys:
            return
        self.current_index = (self.current_index + 1) % len(self.keys)
        logging.info(f"Switching to Key #{self.current_index + 1}")
        
    def reset(self):
        self.current_index = 0
        
    def total_keys(self) -> int:
        return len(self.keys)

# Global singleton instance
key_manager = GeminiKeyManager()
