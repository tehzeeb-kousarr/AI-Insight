from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "admin" or "user"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    settings = relationship("Setting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    calibrations = relationship("Calibration", back_populates="user", cascade="all, delete-orphan")
    voice_commands = relationship("VoiceCommand", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Sensitivities & Speeds
    eye_sensitivity = Column(Float, default=1.0)
    head_sensitivity = Column(Float, default=1.0)
    blink_sensitivity = Column(Float, default=0.20)  # threshold EAR
    dwell_time = Column(Float, default=2.0)  # dwell click delay in seconds
    cursor_speed = Column(Float, default=10.0)
    smoothness = Column(Float, default=0.5)  # alpha for EMA smoothing (0.1 = high smoothing, 0.9 = low smoothing)
    
    # Feature Toggles
    is_eye_tracking_enabled = Column(Boolean, default=False)
    is_head_tracking_enabled = Column(Boolean, default=False)
    is_voice_commands_enabled = Column(Boolean, default=False)
    
    # System configs
    voice_language = Column(String, default="en-US")
    theme = Column(String, default="dark")  # "light", "dark", "high-contrast"
    camera_device = Column(Integer, default=0)
    microphone_device = Column(String, default="default")
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="settings")

class Calibration(Base):
    __tablename__ = "calibrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # points: list of dicts [{"screen_x": float, "screen_y": float, "eye_x": float, "eye_y": float}, ...]
    point_data = Column(JSON, nullable=True)
    # weights: dict {"coef_x": [float], "coef_y": [float], "intercept_x": float, "intercept_y": float}
    regression_weights = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="calibrations")

class VoiceCommand(Base):
    __tablename__ = "voice_commands"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    phrase = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # "open_chrome", "volume_up", "shortcut:ctrl+c", etc.
    is_custom = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="voice_commands")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "click", "voice_command_triggered", "calibration_completed"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="activity_logs")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    user = relationship("User", back_populates="sessions")
