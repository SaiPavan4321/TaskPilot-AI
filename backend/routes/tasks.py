from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from ..models.schemas import TaskCreate, TaskUpdate, TaskResponse
from ..auth.routes import get_current_user
from ..database import get_db
from ..services.ai_prioritizer import AIPrioritizerService
from ..services.risk_assessment import RiskAssessmentService
from ..services.cache_service import AICacheService
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/prioritize", response_model=List[TaskResponse])
async def prioritize_tasks(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    try:
        tasks_coll = db.get_collection("tasks")
        cursor = tasks_coll.find({"user_id": str(current_user["_id"]), "completed": False})
        tasks = await cursor.to_list(length=100)
        
        if not tasks:
            return []
            
        priorities = AIPrioritizerService.prioritize_tasks(tasks)
        
        for p in priorities:
            task_id = p.get("id")
            if not task_id:
                continue
            try:
                obj_id = ObjectId(task_id)
                update_fields = {
                    "priority": p.get("priority"),
                    "priority_reason": p.get("priority_reason"),
                    "ai_score": p.get("ai_score"),
                    "recommended_order": p.get("recommended_order")
                }
                update_fields = {k: v for k, v in update_fields.items() if v is not None}
                if update_fields:
                    await tasks_coll.update_one({"_id": obj_id, "user_id": str(current_user["_id"])}, {"$set": update_fields})
            except Exception as e:
                import traceback
                logger.error(f"Error prioritizing task {task_id}: {e}\n{traceback.format_exc()}")
                raise HTTPException(status_code=500, detail=str(e))
                
        background_tasks.add_task(RiskAssessmentService.update_risks_for_user, str(current_user["_id"]), db)
        await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
                
        cursor = tasks_coll.find({"user_id": str(current_user["_id"])})
        updated_tasks = await cursor.to_list(length=100)
        return updated_tasks
    except Exception as e:
        import traceback
        logger.error(f"Error in prioritize_tasks: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[TaskResponse])
async def get_tasks(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    tasks_coll = db.get_collection("tasks")
    cursor = tasks_coll.find({"user_id": str(current_user["_id"])})
    tasks = await cursor.to_list(length=100)
    return tasks

@router.post("", response_model=TaskResponse)
async def create_task(task: TaskCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    tasks_coll = db.get_collection("tasks")
    task_dict = task.model_dump()
    task_dict["user_id"] = str(current_user["_id"])
    task_dict["created_at"] = datetime.utcnow().isoformat()
    
    res = await tasks_coll.insert_one(task_dict)
    task_dict["_id"] = str(res.inserted_id)
    
    # Auto-prioritize new task
    try:
        ai_res = AIPrioritizerService.prioritize_tasks([task_dict])
        if ai_res and len(ai_res) > 0:
            updates = ai_res[0]
            priority_update = {
                "priority": updates.get("priority", task_dict.get("priority")),
                "priority_reason": updates.get("priority_reason"),
                "ai_score": updates.get("ai_score"),
                "recommended_order": updates.get("recommended_order")
            }
            await tasks_coll.update_one({"_id": res.inserted_id, "user_id": str(current_user["_id"])}, {"$set": priority_update})
            task_dict.update(priority_update)
    except Exception as e:
        logger.error(f"Auto-prioritize error: {e}")
        
    background_tasks.add_task(RiskAssessmentService.update_risks_for_user, str(current_user["_id"]), db)
    await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
    return task_dict

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task: TaskUpdate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    tasks_coll = db.get_collection("tasks")
    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID")
        
    # Verify ownership
    existing_task = await tasks_coll.find_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = {k: v for k, v in task.model_dump().items() if v is not None}
    if update_data:
        await tasks_coll.update_one({"_id": obj_id, "user_id": str(current_user["_id"])}, {"$set": update_data})
        background_tasks.add_task(RiskAssessmentService.update_risks_for_user, str(current_user["_id"]), db)
        await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
        
    updated_task = await tasks_coll.find_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    return updated_task

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    tasks_coll = db.get_collection("tasks")
    try:
        obj_id = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid task ID")
        
    res = await tasks_coll.delete_one({"_id": obj_id, "user_id": str(current_user["_id"])})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    await AICacheService.invalidate_ai_cache(db, str(current_user["_id"]))
    return {"status": "success"}
