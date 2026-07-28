from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api import deps
from app.db import models, schemas
from app.core.database import get_db
from app.services.voice_service import voice_service

router = APIRouter()

@router.get("", response_model=List[schemas.VoiceCommand])
def get_user_voice_commands(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Fetch user's custom commands
    db_commands = db.query(models.VoiceCommand).filter(models.VoiceCommand.user_id == current_user.id).all()
    return db_commands

@router.get("/predefined", response_model=Dict[str, str])
def get_predefined_voice_commands(current_user: models.User = Depends(deps.get_current_user)):
    return voice_service.predefined_commands

@router.post("", response_model=schemas.VoiceCommand, status_code=status.HTTP_201_CREATED)
def create_custom_voice_command(
    command_in: schemas.VoiceCommandCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Verify prefix and command phrase doesn't conflict with existing ones
    phrase = command_in.phrase.lower().strip()
    exists = db.query(models.VoiceCommand).filter(
        models.VoiceCommand.user_id == current_user.id,
        models.VoiceCommand.phrase == phrase
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Voice command phrase already exists")
        
    db_command = models.VoiceCommand(
        user_id=current_user.id,
        phrase=phrase,
        action=command_in.action,
        is_custom=True
    )
    db.add(db_command)
    db.commit()
    db.refresh(db_command)
    return db_command

@router.delete("/{command_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_voice_command(
    command_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    db_command = db.query(models.VoiceCommand).filter(
        models.VoiceCommand.id == command_id,
        models.VoiceCommand.user_id == current_user.id
    ).first()
    if not db_command:
        raise HTTPException(status_code=404, detail="Voice command not found")
        
    db.delete(db_command)
    db.commit()
    return None
