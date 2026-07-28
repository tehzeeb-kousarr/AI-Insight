import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InSight AI Vision HCI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyforinsightaivisionsoftwarehci")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./insight.db")
    
    # AI Engine settings
    CAMERA_INDEX: int = 0
    DEFAULT_DWELL_TIME_SEC: float = 2.0
    DEFAULT_SMOOTHNESS: float = 0.5
    DEFAULT_EYE_SENSITIVITY: float = 1.0
    DEFAULT_HEAD_SENSITIVITY: float = 1.0
    
    class Config:
        case_sensitive = True

settings = Settings()
