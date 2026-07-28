from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.db import models, schemas
from app.api import deps

router = APIRouter()

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    user_exists = db.query(models.User).filter(
        (models.User.username == user_in.username) | (models.User.email == user_in.email)
    ).first()
    if user_exists:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Hash password and create user
    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role="admin" if db.query(models.User).count() == 0 else "user" # First user is admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default settings for user
    db_settings = models.Setting(
        user_id=db_user.id,
        eye_sensitivity=settings.DEFAULT_EYE_SENSITIVITY,
        head_sensitivity=settings.DEFAULT_HEAD_SENSITIVITY,
        blink_sensitivity=0.20,
        dwell_time=settings.DEFAULT_DWELL_TIME_SEC,
        cursor_speed=settings.DEFAULT_DWELL_TIME_SEC * 5.0, # default speed
        smoothness=settings.DEFAULT_SMOOTHNESS
    )
    db.add(db_settings)
    
    # Pre-populate some starter custom commands
    default_commands = [
        models.VoiceCommand(user_id=db_user.id, phrase="open web", action="system:start chrome", is_custom=True),
        models.VoiceCommand(user_id=db_user.id, phrase="type hello", action="shortcut:h+e+l+l+o", is_custom=True)
    ]
    db.add_all(default_commands)
    
    db.commit()
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            subject=user.username, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/forgot-password")
def forgot_password(email_in: schemas.UserUpdate, db: Session = Depends(get_db)):
    # Look up user by email
    user = db.query(models.User).filter(models.User.email == email_in.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User with this email does not exist"
        )
    
    # In a real app, send reset link. Here, we mock-reset and log it.
    # Return success response.
    return {"message": "Password reset instructions sent to your email. Check your inbox!"}

@router.get("/me", response_model=schemas.User)
def get_current_user_profile(current_user: models.User = Depends(deps.get_current_user)):
    return current_user
