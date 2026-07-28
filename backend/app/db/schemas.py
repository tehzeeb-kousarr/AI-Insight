from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Setting Schemas
class SettingBase(BaseModel):
    eye_sensitivity: Optional[float] = 1.0
    head_sensitivity: Optional[float] = 1.0
    blink_sensitivity: Optional[float] = 0.20
    dwell_time: Optional[float] = 2.0
    cursor_speed: Optional[float] = 10.0
    smoothness: Optional[float] = 0.5
    is_eye_tracking_enabled: Optional[bool] = False
    is_head_tracking_enabled: Optional[bool] = False
    is_voice_commands_enabled: Optional[bool] = False
    voice_language: Optional[str] = "en-US"
    theme: Optional[str] = "dark"
    camera_device: Optional[int] = 0
    microphone_device: Optional[str] = "default"

class SettingUpdate(SettingBase):
    pass

class Setting(SettingBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Calibration Schemas
class CalibrationBase(BaseModel):
    point_data: Optional[List[Dict[str, Any]]] = None
    regression_weights: Optional[Dict[str, Any]] = None

class CalibrationCreate(CalibrationBase):
    pass

class CalibrationPointSubmit(BaseModel):
    screen_x: float
    screen_y: float
    # horizontal & vertical ratios derived by front-end / back-end
    eye_x: Optional[float] = None
    eye_y: Optional[float] = None

class Calibration(CalibrationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Voice Command Schemas
class VoiceCommandBase(BaseModel):
    phrase: str
    action: str  # "open_chrome", "volume_up", "shortcut:ctrl+c", etc.
    is_custom: Optional[bool] = True

class VoiceCommandCreate(VoiceCommandBase):
    pass

class VoiceCommand(VoiceCommandBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Activity Log Schemas
class ActivityLogBase(BaseModel):
    action: str
    details: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    user_id: Optional[int] = None

class ActivityLog(ActivityLogBase):
    id: int
    user_id: Optional[int] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Session Schemas
class SessionBase(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0

class Session(SessionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Combined Dashboard Status Schema
class SystemStatus(BaseModel):
    camera_status: bool
    eye_detection_status: bool
    head_tracking_status: bool
    voice_recognition_status: bool
    calibration_status: bool
    current_cursor_pos: Dict[str, int]
    fps: float
    cpu_usage: float
    memory_usage: float
    today_usage_seconds: int
