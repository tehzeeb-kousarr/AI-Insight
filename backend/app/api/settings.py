from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models, schemas
from app.core.database import get_db
from app.services.ai_engine import ai_engine
from app.services.voice_service import voice_service

router = APIRouter()

@router.get("", response_model=schemas.Setting)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    settings_record = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if not settings_record:
        # Fallback creation
        settings_record = models.Setting(user_id=current_user.id)
        db.add(settings_record)
        db.commit()
        db.refresh(settings_record)
    return settings_record

@router.put("", response_model=schemas.Setting)
def update_user_settings(
    settings_in: schemas.SettingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    settings_record = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if not settings_record:
        raise HTTPException(status_code=404, detail="Settings record not found")
    
    # Store old state for service toggles
    old_camera = settings_record.camera_device
    old_voice_enabled = settings_record.is_voice_commands_enabled
    
    # Update fields in DB
    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings_record, field, value)
    
    db.commit()
    db.refresh(settings_record)
    
    # Sync settings with AI Engine
    ai_engine.update_settings(settings_record)
    
    # Restart camera if camera index changed
    if settings_record.is_eye_tracking_enabled or settings_record.is_head_tracking_enabled:
        ai_engine.start(settings_record.camera_device)
    else:
        # If both are disabled, stop engine
        if not settings_record.is_eye_tracking_enabled and not settings_record.is_head_tracking_enabled:
            ai_engine.stop()
            
    # Sync with Voice Service
    if settings_record.is_voice_commands_enabled:
        voice_service.start(current_user.id)
        voice_service.toggle(True)
        voice_service.update_language(settings_record.voice_language)
    else:
        if old_voice_enabled:
            voice_service.toggle(False)
            
    return settings_record
