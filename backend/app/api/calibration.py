from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models, schemas
from app.core.database import get_db
from app.services.ai_engine import ai_engine

router = APIRouter()

@router.post("/clear")
def clear_calibration(current_user: models.User = Depends(deps.get_current_user)):
    ai_engine.clear_calibration_points()
    return {"message": "Calibration points cleared"}

@router.post("/point")
def record_calibration_point(
    point: schemas.CalibrationPointSubmit,
    current_user: models.User = Depends(deps.get_current_user)
):
    eye_x = point.eye_x
    eye_y = point.eye_y
    if eye_x is None or eye_y is None:
        eye_x, eye_y = ai_engine.get_latest_eye_ratio()
    # Register point
    ai_engine.add_calibration_point(point.screen_x, point.screen_y, eye_x, eye_y)
    return {
        "message": f"Recorded point at Screen({point.screen_x}, {point.screen_y}) with Eye({eye_x}, {eye_y})",
        "total_points": len(ai_engine.calibration_points)
    }

@router.post("/fit")
def fit_calibration_model(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    res = ai_engine.fit_calibration()
    if not res:
        raise HTTPException(status_code=400, detail="Cannot fit calibration. Ensure you recorded at least 5 points.")
        
    # Save weights to DB
    calibration_record = db.query(models.Calibration).filter(models.Calibration.user_id == current_user.id).first()
    if not calibration_record:
        calibration_record = models.Calibration(user_id=current_user.id)
        db.add(calibration_record)
        
    calibration_record.point_data = res["points"]
    calibration_record.regression_weights = {
        "coef_x": res["coef_x"],
        "intercept_x": res["intercept_x"],
        "coef_y": res["coef_y"],
        "intercept_y": res["intercept_y"]
    }
    
    # Write activity log
    log = models.ActivityLog(user_id=current_user.id, action="calibration_completed", details="Finished 5-point calibration")
    db.add(log)
    
    db.commit()
    return {"message": "Calibration fitted and saved successfully", "weights": calibration_record.regression_weights}

@router.get("", response_model=schemas.CalibrationBase)
def get_user_calibration(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    calibration_record = db.query(models.Calibration).filter(models.Calibration.user_id == current_user.id).first()
    if not calibration_record:
        return {"point_data": [], "regression_weights": {}}
    return calibration_record
