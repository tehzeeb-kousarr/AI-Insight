import cv2
import mediapipe as mp
import numpy as np
import pyautogui
import time
import threading
import logging
from typing import Dict, List, Tuple, Optional, Any
from sklearn.linear_model import Ridge
from app.core.config import settings

# Disable PyAutoGUI fail-safe to prevent application crashing if mouse goes to screen corners, 
# but keep coordinates bounded.
pyautogui.FAILSAFE = False

logger = logging.getLogger("insight.ai_engine")

class AIEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(AIEngine, cls).__new__(cls, *args, **kwargs)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        # Thread control
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.camera_lock = threading.Lock()
        
        # Video Capture & Mediapipe
        self.cap = None
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = None
        
        # State & Settings
        self.camera_device = 0
        self.eye_sensitivity = 1.0
        self.head_sensitivity = 1.0
        self.blink_sensitivity = 0.20 # Default threshold EAR
        self.dwell_time = 2.0 # seconds
        self.cursor_speed = 10.0
        self.smoothness = 0.5 # alpha for EMA
        
        self.is_eye_tracking_enabled = False
        self.is_head_tracking_enabled = False
        
        # Status indicators
        self.fps = 0.0
        self.camera_status = False
        self.eye_detection_status = False
        self.head_tracking_status = False
        self.calibration_status = False
        self.current_cursor_pos = {"x": 0, "y": 0}
        
        # Latest frame with overlays (JPEG bytes)
        self.latest_frame_bytes = None
        self.frame_lock = threading.Lock()
        
        # Calibration state
        self.calibration_points: List[Dict[str, float]] = []
        self.reg_x = None
        self.reg_y = None
        
        # Gaze tracking memory
        self.prev_cursor_x = 0
        self.prev_cursor_y = 0
        
        # Head tracking baseline
        self.head_baseline_x = None
        self.head_baseline_y = None
        
        # Blink detection variables
        self.blink_counter = 0
        self.eyes_closed_start = 0
        self.last_blink_time = 0
        self.blink_count_in_window = 0
        
        # Dwell click variables
        self.dwell_start_time = 0
        self.dwell_pos_x = 0
        self.dwell_pos_y = 0
        
        # Screen dimensions
        self.screen_width, self.screen_height = pyautogui.size()

    def start(self, camera_device: int = 0):
        with self.camera_lock:
            if self.running:
                if self.camera_device == camera_device:
                    return
                else:
                    self.stop_internal()
            
            self.camera_device = camera_device
            self.running = True
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()
            logger.info(f"AI Engine thread started with camera index {camera_device}")

    def stop(self):
        with self.camera_lock:
            self.stop_internal()

    def stop_internal(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            self.thread = None
        if self.cap:
            self.cap.release()
            self.cap = None
        self.camera_status = False
        logger.info("AI Engine thread stopped")

    def update_settings(self, user_settings):
        self.eye_sensitivity = user_settings.eye_sensitivity
        self.head_sensitivity = user_settings.head_sensitivity
        self.blink_sensitivity = user_settings.blink_sensitivity
        self.dwell_time = user_settings.dwell_time
        self.cursor_speed = user_settings.cursor_speed
        self.smoothness = user_settings.smoothness
        self.is_eye_tracking_enabled = user_settings.is_eye_tracking_enabled
        self.is_head_tracking_enabled = user_settings.is_head_tracking_enabled
        self.camera_device = user_settings.camera_device
        logger.info("AI Engine settings updated")

    def add_calibration_point(self, screen_x: float, screen_y: float, eye_x: float, eye_y: float):
        self.calibration_points.append({
            "screen_x": screen_x,
            "screen_y": screen_y,
            "eye_x": eye_x,
            "eye_y": eye_y
        })
        logger.info(f"Calibration point added: Screen({screen_x}, {screen_y}) -> Eye({eye_x}, {eye_y})")

    def clear_calibration_points(self):
        self.calibration_points = []
        self.reg_x = None
        self.reg_y = None
        self.calibration_status = False
        logger.info("Calibration points cleared")

    def fit_calibration(self) -> Optional[Dict[str, Any]]:
        if len(self.calibration_points) < 5:
            logger.warning("Need at least 5 points to fit calibration model")
            return None
        
        X = np.array([[p["eye_x"], p["eye_y"]] for p in self.calibration_points])
        y_x = np.array([p["screen_x"] for p in self.calibration_points])
        y_y = np.array([p["screen_y"] for p in self.calibration_points])
        
        self.reg_x = Ridge(alpha=1.0).fit(X, y_x)
        self.reg_y = Ridge(alpha=1.0).fit(X, y_y)
        self.calibration_status = True
        logger.info("Calibration model fitted successfully")
        
        return {
            "coef_x": self.reg_x.coef_.tolist(),
            "intercept_x": float(self.reg_x.intercept_),
            "coef_y": self.reg_y.coef_.tolist(),
            "intercept_y": float(self.reg_y.intercept_),
            "points": self.calibration_points
        }

    def load_calibration(self, weights: Dict[str, Any]):
        if not weights:
            return
        try:
            self.reg_x = Ridge(alpha=1.0)
            self.reg_x.coef_ = np.array(weights["coef_x"])
            self.reg_x.intercept_ = weights["intercept_x"]
            
            self.reg_y = Ridge(alpha=1.0)
            self.reg_y.coef_ = np.array(weights["coef_y"])
            self.reg_y.intercept_ = weights["intercept_y"]
            
            self.calibration_points = weights.get("points", [])
            self.calibration_status = True
            logger.info("Calibration model loaded from weights")
        except Exception as e:
            logger.error(f"Error loading calibration weights: {e}")

    def get_latest_eye_ratio(self) -> Tuple[float, float]:
        """Returns the current raw eye ratio (x, y) if tracking is active, otherwise (0.5, 0.5)"""
        return getattr(self, "_current_eye_ratio", (0.5, 0.5))

    def get_overlay_frame(self) -> bytes:
        with self.frame_lock:
            if self.latest_frame_bytes is None:
                # Return an empty black frame placeholder
                img = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(img, "Camera Starting...", (180, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                _, jpeg = cv2.imencode(".jpg", img)
                return jpeg.tobytes()
            return self.latest_frame_bytes

    def get_status(self) -> Dict[str, Any]:
        return {
            "camera_status": self.camera_status,
            "eye_detection_status": self.eye_detection_status,
            "head_tracking_status": self.is_head_tracking_enabled and self.head_tracking_status,
            "calibration_status": self.calibration_status,
            "current_cursor_pos": self.current_cursor_pos,
            "fps": round(self.fps, 1)
        }

    def _calculate_ear(self, landmarks, eye_indices: List[int]) -> float:
        # EAR calculation: Vertical distance / Horizontal distance
        # Indices list: [inner_corner, outer_corner, upper_eyelid, lower_eyelid]
        p_inner = np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y])
        p_outer = np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y])
        p_upper = np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y])
        p_lower = np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y])
        
        vertical_dist = np.linalg.norm(p_upper - p_lower)
        horizontal_dist = np.linalg.norm(p_inner - p_outer)
        
        if horizontal_dist == 0:
            return 0.0
        return vertical_dist / horizontal_dist

    def _loop(self):
        self.cap = cv2.VideoCapture(self.camera_device, cv2.CAP_DSHOW if cv2.os.name == 'nt' else cv2.CAP_ANY)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        if not self.cap.isOpened():
            logger.error(f"Cannot open camera device {self.camera_device}")
            self.camera_status = False
            self.running = False
            return
        
        self.camera_status = True
        
        # Setup Face Mesh
        # We need refined landmarks for irises
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        prev_time = time.time()
        
        # Mediapipe landmark mapping indices
        # Right eye: 133 (inner), 33 (outer), 159 (upper), 145 (lower), 468 (iris center)
        right_eye_indices = [133, 33, 159, 145]
        # Left eye: 362 (inner), 263 (outer), 386 (upper), 374 (lower), 473 (iris center)
        left_eye_indices = [362, 263, 386, 374]
        
        while self.running:
            success, frame = self.cap.read()
            if not success:
                logger.warning("Failed to grab camera frame")
                self.camera_status = False
                time.sleep(0.03)
                continue
            
            self.camera_status = True
            
            # Flip frame horizontally for natural mirror view
            frame = cv2.flip(frame, 1)
            h, w, c = frame.shape
            
            # Convert color to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            self.eye_detection_status = False
            self.head_tracking_status = False
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0].landmark
                self.eye_detection_status = True
                
                # ---- BLINK DETECTION ----
                ear_left = self._calculate_ear(landmarks, left_eye_indices)
                ear_right = self._calculate_ear(landmarks, right_eye_indices)
                avg_ear = (ear_left + ear_right) / 2.0
                
                # Check for blink start
                if avg_ear < self.blink_sensitivity:
                    if self.eyes_closed_start == 0:
                        self.eyes_closed_start = time.time()
                else:
                    if self.eyes_closed_start > 0:
                        closure_duration = time.time() - self.eyes_closed_start
                        self.eyes_closed_start = 0
                        
                        # Process closure duration
                        if closure_duration > 1.0:
                            # Long blink -> Right Click
                            logger.info("Long blink detected -> Right Click")
                            pyautogui.rightClick()
                        else:
                            # Short blink -> check for double blink
                            now = time.time()
                            if now - self.last_blink_time < 0.5:
                                self.blink_count_in_window += 1
                            else:
                                self.blink_count_in_window = 1
                            
                            self.last_blink_time = now
                            
                            # Execute click actions
                            if self.blink_count_in_window == 2:
                                logger.info("Double blink detected -> Double Click")
                                pyautogui.doubleClick()
                                self.blink_count_in_window = 0
                            else:
                                # We delay slightly or run single click
                                # To avoid firing single-click on first blink of double-blink:
                                # For simplicity in HCI, instant click is preferred:
                                logger.info("Single blink detected -> Left Click")
                                pyautogui.click()
                
                # ---- EYE TRACKING (GAZE ESTIMATION) ----
                # Iris center landmarks (468: Right, 473: Left)
                iris_r = landmarks[468]
                iris_l = landmarks[473]
                
                # Normalized coordinate computation relative to eye boundaries
                # Let's average the ratios of both eyes for stability
                # Left Eye Ratios
                lc_left = landmarks[362] # inner
                rc_left = landmarks[263] # outer
                tc_left = landmarks[386] # upper
                bc_left = landmarks[374] # lower
                
                ratio_x_left = (iris_l.x - lc_left.x) / (rc_left.x - lc_left.x + 1e-6)
                ratio_y_left = (iris_l.y - tc_left.y) / (bc_left.y - tc_left.y + 1e-6)
                
                # Right Eye Ratios
                lc_right = landmarks[133] # inner
                rc_right = landmarks[33] # outer
                tc_right = landmarks[159] # upper
                bc_right = landmarks[145] # lower
                
                ratio_x_right = (iris_r.x - lc_right.x) / (rc_right.x - lc_right.x + 1e-6)
                ratio_y_right = (iris_r.y - tc_right.y) / (bc_right.y - tc_right.y + 1e-6)
                
                avg_eye_x = (ratio_x_left + ratio_x_right) / 2.0
                avg_eye_y = (ratio_y_left + ratio_y_right) / 2.0
                
                # Expose the current eye ratios for calibration endpoints
                self._current_eye_ratio = (avg_eye_x, avg_eye_y)
                
                # Move cursor via eye tracking if enabled
                cursor_moved = False
                target_x, target_y = self.prev_cursor_x, self.prev_cursor_y
                
                if self.is_eye_tracking_enabled:
                    if self.calibration_status and self.reg_x and self.reg_y:
                        # Map ratios to screen positions using fitted Ridge model
                        pred_x = self.reg_x.predict([[avg_eye_x, avg_eye_y]])[0]
                        pred_y = self.reg_y.predict([[avg_eye_x, avg_eye_y]])[0]
                        
                        target_x = max(0, min(self.screen_width, int(pred_x)))
                        target_y = max(0, min(self.screen_height, int(pred_y)))
                        cursor_moved = True
                    else:
                        # Fallback mapping: typical user eye ratio ranges from 0.35 to 0.65
                        norm_x = (avg_eye_x - 0.35) / 0.3
                        norm_y = (avg_eye_y - 0.38) / 0.24
                        
                        norm_x = max(0.0, min(1.0, norm_x))
                        norm_y = max(0.0, min(1.0, norm_y))
                        
                        target_x = int(norm_x * self.screen_width)
                        target_y = int(norm_y * self.screen_height)
                        cursor_moved = True
                
                # ---- HEAD TRACKING ----
                # Nose tip (4)
                nose = landmarks[4]
                self.head_tracking_status = True
                
                if self.is_head_tracking_enabled:
                    if self.head_baseline_x is None:
                        self.head_baseline_x = nose.x
                        self.head_baseline_y = nose.y
                    
                    # Compute relative translation
                    dx = nose.x - self.head_baseline_x
                    dy = nose.y - self.head_baseline_y
                    
                    # Apply deadzone and sensitivity
                    deadzone = 0.015
                    if abs(dx) > deadzone or abs(dy) > deadzone:
                        # Relative joystick cursor control
                        move_x = 0
                        move_y = 0
                        
                        if abs(dx) > deadzone:
                            # Left-right movement
                            move_x = int(np.sign(dx) * (abs(dx) - deadzone) * self.head_sensitivity * self.cursor_speed * 15)
                        
                        if abs(dy) > deadzone:
                            # Up-down movement
                            move_y = int(np.sign(dy) * (abs(dy) - deadzone) * self.head_sensitivity * self.cursor_speed * 15)
                        
                        current_x, current_y = pyautogui.position()
                        target_x = max(0, min(self.screen_width, current_x + move_x))
                        target_y = max(0, min(self.screen_height, current_y + move_y))
                        cursor_moved = True
                else:
                    # Reset head baseline when disabled
                    self.head_baseline_x = None
                    self.head_baseline_y = None
                
                # ---- APPLY SMOOTHING & MOVE MOUSE ----
                if cursor_moved:
                    # Exponential Moving Average (EMA) smoothing
                    # alpha = 1.0 - smoothness (smoothness=0.9 -> alpha=0.1 (high smooth), smoothness=0.1 -> alpha=0.9 (low smooth))
                    alpha = max(0.05, min(1.0, 1.0 - self.smoothness))
                    smoothed_x = int(alpha * target_x + (1.0 - alpha) * self.prev_cursor_x)
                    smoothed_y = int(alpha * target_y + (1.0 - alpha) * self.prev_cursor_y)
                    
                    pyautogui.moveTo(smoothed_x, smoothed_y)
                    
                    self.prev_cursor_x = smoothed_x
                    self.prev_cursor_y = smoothed_y
                    self.current_cursor_pos = {"x": smoothed_x, "y": smoothed_y}
                    
                    # ---- DWELL CLICKING ----
                    # If cursor stays within 15 pixels of last dwell position
                    dist = np.linalg.norm(np.array([smoothed_x, smoothed_y]) - np.array([self.dwell_pos_x, self.dwell_pos_y]))
                    if dist < 15:
                        if self.dwell_start_time == 0:
                            self.dwell_start_time = time.time()
                        elif time.time() - self.dwell_start_time >= self.dwell_time:
                            # Trigger click
                            logger.info(f"Dwell click triggered at ({smoothed_x}, {smoothed_y})")
                            pyautogui.click()
                            self.dwell_start_time = 0 # reset
                    else:
                        # Reset dwell anchor
                        self.dwell_pos_x = smoothed_x
                        self.dwell_pos_y = smoothed_y
                        self.dwell_start_time = time.time()
                
                # ---- VISUAL FEED OVERLAYS ----
                # Draw facial landmarks
                for index in [33, 133, 159, 145, 263, 362, 386, 374]:
                    lm = landmarks[index]
                    cv2.circle(frame, (int(lm.x * w), int(lm.y * h)), 2, (0, 255, 0), -1)
                
                # Draw Iris centers
                cv2.circle(frame, (int(iris_l.x * w), int(iris_l.y * h)), 3, (255, 0, 0), -1)
                cv2.circle(frame, (int(iris_r.x * w), int(iris_r.y * h)), 3, (255, 0, 0), -1)
                
                # Draw Nose Tip (for head tracking reference)
                cv2.circle(frame, (int(nose.x * w), int(nose.y * h)), 3, (0, 255, 255), -1)
                
                # Visual notification for Blinks / Clicks
                if avg_ear < self.blink_sensitivity:
                    cv2.putText(frame, "BLINKING", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # FPS calculation
            current_time = time.time()
            self.fps = 1.0 / (current_time - prev_time)
            prev_time = current_time
            
            # Put status text on frame
            cv2.putText(frame, f"FPS: {round(self.fps, 1)}", (w - 120, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            if self.is_eye_tracking_enabled:
                cv2.putText(frame, "EYE TRACKING ACTIVE", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            if self.is_head_tracking_enabled:
                cv2.putText(frame, "HEAD TRACKING ACTIVE", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            # Encode frame to JPEG
            success, jpeg = cv2.imencode(".jpg", frame)
            if success:
                with self.frame_lock:
                    self.latest_frame_bytes = jpeg.tobytes()
            
            # Throttle loop to ~30 FPS
            time.sleep(0.01)
            
        if self.face_mesh:
            self.face_mesh.close()

# Singleton instance
ai_engine = AIEngine()
