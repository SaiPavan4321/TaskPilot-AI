from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AICacheService:
    @staticmethod
    async def get_ai_cache(db, user_id: str, cache_key: str):
        """
        Retrieves a cached AI response if it exists.
        """
        try:
            cache_coll = db.get_collection("ai_cache")
            doc = await cache_coll.find_one({"user_id": user_id, "cache_key": cache_key})
            if doc:
                return doc.get("data")
            return None
        except Exception as e:
            logger.error(f"Error fetching cache for {cache_key}: {e}")
            return None

    @staticmethod
    async def set_ai_cache(db, user_id: str, cache_key: str, data: dict):
        """
        Stores or updates an AI response in the cache.
        """
        try:
            cache_coll = db.get_collection("ai_cache")
            now = datetime.utcnow().isoformat()
            
            await cache_coll.update_one(
                {"user_id": user_id, "cache_key": cache_key},
                {
                    "$set": {
                        "data": data,
                        "updated_at": now
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error setting cache for {cache_key}: {e}")

    @staticmethod
    async def invalidate_ai_cache(db, user_id: str, cache_keys: list = None):
        """
        Invalidates specific cache keys or all cache for a user if cache_keys is None.
        """
        try:
            cache_coll = db.get_collection("ai_cache")
            query = {"user_id": user_id}
            if cache_keys:
                query["cache_key"] = {"$in": cache_keys}
                
            res = await cache_coll.delete_many(query)
            if res.deleted_count > 0:
                logger.info(f"Invalidated {res.deleted_count} cache entries for user {user_id}")
        except Exception as e:
            logger.error(f"Error invalidating cache for user {user_id}: {e}")
