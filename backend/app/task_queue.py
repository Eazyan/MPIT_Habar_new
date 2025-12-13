import os
import json
import redis
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"

# Redis connection
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

# Constants
MAX_ACTIVE_TASKS = 3
TASK_TTL = 3600  # 1 hour

def get_task_key(task_id: str) -> str:
    return f"task:{task_id}"

def get_user_tasks_key(user_id: int) -> str:
    return f"user_tasks:{user_id}"

def save_task(task_id: str, user_id: int, status: TaskStatus, data: Optional[Dict] = None, error: Optional[str] = None):
    """Save or update task status in Redis."""
    task_data = {
        "id": task_id,
        "user_id": user_id,
        "status": status.value,
        "data": data,
        "error": error,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    redis_client.setex(
        get_task_key(task_id),
        TASK_TTL,
        json.dumps(task_data, default=str)
    )
    
    # Track active tasks per user
    if status in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
        redis_client.sadd(get_user_tasks_key(user_id), task_id)
        redis_client.expire(get_user_tasks_key(user_id), TASK_TTL)
    else:
        redis_client.srem(get_user_tasks_key(user_id), task_id)

def get_task(task_id: str) -> Optional[Dict]:
    """Get task status from Redis."""
    data = redis_client.get(get_task_key(task_id))
    if data:
        return json.loads(data)
    return None

def update_task_status(task_id: str, status: TaskStatus, data: Optional[Dict] = None, error: Optional[str] = None):
    """Update existing task status."""
    existing = get_task(task_id)
    if existing:
        existing["status"] = status.value
        existing["updated_at"] = datetime.now().isoformat()
        if data:
            existing["data"] = data
        if error:
            existing["error"] = error
        
        redis_client.setex(
            get_task_key(task_id),
            TASK_TTL,
            json.dumps(existing, default=str)
        )
        
        # Update user tasks set
        user_id = existing.get("user_id")
        if user_id:
            if status in [TaskStatus.PENDING, TaskStatus.PROCESSING]:
                redis_client.sadd(get_user_tasks_key(user_id), task_id)
            else:
                redis_client.srem(get_user_tasks_key(user_id), task_id)

def get_active_task_count(user_id: int) -> int:
    """Get count of active (pending/processing) tasks for user."""
    return redis_client.scard(get_user_tasks_key(user_id))

def can_start_task(user_id: int) -> bool:
    """Check if user can start a new task."""
    return get_active_task_count(user_id) < MAX_ACTIVE_TASKS
