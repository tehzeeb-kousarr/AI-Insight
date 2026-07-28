from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.db import models, schemas

# Set auto_error=False to prevent FastAPI from returning 401 when token header is missing in dev mode
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    # BYPASS AUTHENTICATION FOR DEVELOPMENT MODE
    # To restore full token authorization, comment out or delete the block below.
    mock_user = db.query(models.User).filter(models.User.username == "devuser").first()
    if not mock_user:
        from app.core import security
        mock_user = models.User(
            username="devuser",
            email="dev@insight.ai",
            hashed_password=security.get_password_hash("devpassword"),
            role="admin"
        )
        db.add(mock_user)
        db.commit()
        db.refresh(mock_user)
        
        # Add default settings record for mock user
        db_settings = models.Setting(
            user_id=mock_user.id,
            eye_sensitivity=settings.DEFAULT_EYE_SENSITIVITY,
            head_sensitivity=settings.DEFAULT_HEAD_SENSITIVITY,
            blink_sensitivity=0.20,
            dwell_time=settings.DEFAULT_DWELL_TIME_SEC,
            cursor_speed=10.0,
            smoothness=settings.DEFAULT_SMOOTHNESS
        )
        db.add(db_settings)
        db.commit()
    return mock_user

    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
    """

def get_current_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user
