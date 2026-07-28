from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.db import models, schemas
from app.core.database import get_db

router = APIRouter()

@router.get("", response_model=List[schemas.ActivityLog])
def get_activity_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
    limit: int = 100
):
    # Admins see all logs, regular users see only their own
    query = db.query(models.ActivityLog)
    if current_user.role != "admin":
        query = query.filter(models.ActivityLog.user_id == current_user.id)
    
    logs = query.order_by(models.ActivityLog.timestamp.desc()).limit(limit).all()
    return logs

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_activity_logs(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(deps.get_current_admin)
):
    db.query(models.ActivityLog).delete()
    db.commit()
    return None
