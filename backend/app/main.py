from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import psutil
import time
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.db import models, schemas
from app.api import auth, settings as api_settings, calibration, voice_commands, reports, logs, deps
from app.services.ai_engine import ai_engine
from app.services.voice_service import voice_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("insight.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="InSight AI Vision Backend for Hands-Free Computer Interaction",
    version="1.0.0",
    docs_url="/docs"
)

# CORS middleware for React connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to react URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(api_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["Settings"])
app.include_router(calibration.router, prefix=f"{settings.API_V1_STR}/calibration", tags=["Calibration"])
app.include_router(voice_commands.router, prefix=f"{settings.API_V1_STR}/voice-commands", tags=["Voice Commands"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Analytics"])
app.include_router(logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["Activity Logs"])

@app.on_event("startup")
def startup_event():
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized.")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Stopping tracking engines...")
    ai_engine.stop()
    voice_service.stop()
    logger.info("Clean shutdown complete.")

@app.get("/api/video_feed")
def get_video_feed():
    def gen_frames():
        while True:
            frame_bytes = ai_engine.get_overlay_frame()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            # 30 FPS stream throttling
            time.sleep(0.03)
            
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/status", response_model=schemas.SystemStatus)
def get_system_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory().percent
    
    # Get status from AI engine
    ai_status = ai_engine.get_status()
    
    # Ensure tracking profiles are synced
    # Load calibration coefficients on the first check if not loaded
    if ai_status["camera_status"] and not ai_engine.calibration_status:
        calibration_record = db.query(models.Calibration).filter(models.Calibration.user_id == current_user.id).first()
        if calibration_record and calibration_record.regression_weights:
            ai_engine.load_calibration(calibration_record.regression_weights)
            
    # Track usage sessions dynamically
    now = datetime.now(timezone.utc)
    # Check if there is an active session within the last 15 minutes
    active_session = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.end_time == None
    ).order_by(models.Session.start_time.desc()).first()
    
    if active_session:
        # Check if the active session is recent (e.g., within 30 minutes)
        # If it is, update end_time and duration.
        start_time = active_session.start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        diff = now - start_time
        active_session.duration_seconds = int(diff.total_seconds())
    else:
        # Create a new session
        new_session = models.Session(user_id=current_user.id, start_time=now)
        db.add(new_session)
        
    db.commit()
    
    # Sum today's total usage seconds
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.start_time >= today_start
    ).all()
    today_seconds = sum(s.duration_seconds for s in sessions)
    
    # Load settings from db to check if voice is enabled and startup if needed
    settings_record = db.query(models.Setting).filter(models.Setting.user_id == current_user.id).first()
    if settings_record:
        if settings_record.is_voice_commands_enabled and not voice_service.running:
            voice_service.start(current_user.id)
            voice_service.toggle(True)
            voice_service.update_language(settings_record.voice_language)
            
    return {
        "camera_status": ai_status["camera_status"],
        "eye_detection_status": ai_status["eye_detection_status"],
        "head_tracking_status": ai_status["head_tracking_status"],
        "voice_recognition_status": voice_service.microphone_status and voice_service.enabled,
        "calibration_status": ai_engine.calibration_status,
        "current_cursor_pos": ai_status["current_cursor_pos"],
        "fps": ai_status["fps"],
        "cpu_usage": cpu,
        "memory_usage": mem,
        "today_usage_seconds": today_seconds
    }
