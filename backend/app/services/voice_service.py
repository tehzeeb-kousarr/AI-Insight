import speech_recognition as sr
import pyautogui
import os
import subprocess
import threading
import time
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.db.models import VoiceCommand, ActivityLog

logger = logging.getLogger("insight.voice_service")

class VoiceService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(VoiceService, cls).__new__(cls, *args, **kwargs)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self.running = False
        self.enabled = False
        self.thread: Optional[threading.Thread] = None
        self.recognizer = sr.Recognizer()
        self.recognizer.dynamic_energy_threshold = True
        
        self.microphone_status = False
        self.user_id = None
        self.voice_language = "en-US"
        self.last_recognized_text = ""
        self.is_listening = False

        # Predefined mapping of commands to system shell tasks or PyAutoGUI actions
        self.predefined_commands = {
            "open chrome": "system:start chrome",
            "open edge": "system:start msedge",
            "open calculator": "system:calc",
            "open file explorer": "system:explorer",
            "open notepad": "system:notepad",
            "close window": "shortcut:alt+f4",
            "minimize window": "shortcut:win+d",
            "scroll up": "action:scroll_up",
            "scroll down": "action:scroll_down",
            "volume up": "action:volume_up",
            "volume down": "action:volume_down",
            "mute": "action:mute",
            "copy": "shortcut:ctrl+c",
            "paste": "shortcut:ctrl+v",
            "undo": "shortcut:ctrl+z",
            "redo": "shortcut:ctrl+y",
            "screenshot": "action:screenshot",
            "lock screen": "system:rundll32.exe user32.dll,LockWorkStation",
            "shutdown": "system:shutdown /s /t 60",
            "restart": "system:shutdown /r /t 60",
            "sleep": "system:rundll32.exe powrprof.dll,SetSuspendState 0,1,0"
        }

    def start(self, user_id: int):
        self.user_id = user_id
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        logger.info("Voice Service thread started")

    def stop(self):
        self.running = False
        self.enabled = False
        if self.thread:
            self.thread.join(timeout=2.0)
            self.thread = None
        logger.info("Voice Service thread stopped")

    def toggle(self, enable: bool):
        self.enabled = enable
        logger.info(f"Voice Recognition enabled state toggled to: {enable}")

    def update_language(self, lang: str):
        self.voice_language = lang
        logger.info(f"Voice language updated to: {lang}")

    def execute_command(self, action: str):
        logger.info(f"Executing action: {action}")
        try:
            if action.startswith("system:"):
                cmd = action.split(":", 1)[1]
                subprocess.Popen(cmd, shell=True)
            elif action.startswith("shortcut:"):
                keys_str = action.split(":", 1)[1]
                keys = keys_str.split("+")
                pyautogui.hotkey(*keys)
            elif action.startswith("action:"):
                act = action.split(":", 1)[1]
                if act == "scroll_up":
                    pyautogui.scroll(300)
                elif act == "scroll_down":
                    pyautogui.scroll(-300)
                elif act == "volume_up":
                    pyautogui.press("volumeup")
                elif act == "volume_down":
                    pyautogui.press("volumedown")
                elif act == "mute":
                    pyautogui.press("volumemute")
                elif act == "screenshot":
                    # Take screenshot and save it to user pictures or desktop
                    path = os.path.expanduser("~/Desktop/InSight_Screenshot.png")
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    pyautogui.screenshot(path)
                    logger.info(f"Screenshot saved to {path}")
            
            # Log action to DB
            self._log_activity("voice_command_executed", f"Triggered action: {action}")
            
        except Exception as e:
            logger.error(f"Error executing command action {action}: {e}")
            self._log_activity("voice_command_failed", f"Failed action {action}: {str(e)}")

    def _log_activity(self, action: str, details: str):
        if not self.user_id:
            return
        db = SessionLocal()
        try:
            log = ActivityLog(user_id=self.user_id, action=action, details=details)
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to write voice activity log to DB: {e}")
        finally:
            db.close()

    def _match_and_dispatch(self, spoken_text: str):
        text = spoken_text.lower().strip()
        self.last_recognized_text = spoken_text
        
        # Check database for custom voice commands first
        db = SessionLocal()
        db_command = None
        try:
            db_command = db.query(VoiceCommand).filter(
                VoiceCommand.user_id == self.user_id,
                VoiceCommand.phrase.ilike(text)
            ).first()
        except Exception as e:
            logger.error(f"Database query error in voice service: {e}")
        finally:
            db.close()

        if db_command:
            logger.info(f"Custom command matched in DB: '{text}' -> {db_command.action}")
            self.execute_command(db_command.action)
            return

        # Check predefined commands (approximate check or exact match)
        for phrase, action in self.predefined_commands.items():
            if phrase in text or text in phrase:
                logger.info(f"Predefined command matched: '{phrase}' -> {action}")
                self.execute_command(action)
                return

        logger.info(f"No command matched spoken phrase: '{text}'")
        self._log_activity("voice_command_unmatched", f"Spoken phrase: '{spoken_text}'")

    def _loop(self):
        while self.running:
            if not self.enabled:
                self.is_listening = False
                time.sleep(0.5)
                continue
            
            # Setup microphone source
            try:
                with sr.Microphone() as source:
                    self.microphone_status = True
                    self.is_listening = True
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    
                    while self.running and self.enabled:
                        logger.debug("Listening for voice commands...")
                        try:
                            audio = self.recognizer.listen(source, timeout=1.0, phrase_time_limit=3.0)
                            self.is_listening = False
                            
                            # Transcribe voice
                            try:
                                text = self.recognizer.recognize_google(audio, language=self.voice_language)
                                logger.info(f"Recognized voice: {text}")
                                self._match_and_dispatch(text)
                            except sr.UnknownValueError:
                                logger.debug("Speech unrecognized (silence or ambient sound)")
                            except sr.RequestError as e:
                                logger.error(f"Google speech service request error: {e}")
                                # Network is probably down, throttle logs
                                time.sleep(2)
                            
                            self.is_listening = True
                            
                        except sr.WaitTimeoutError:
                            # Timeout elapsed while waiting for phrase, keep looping
                            continue
            except Exception as e:
                logger.error(f"Microphone init failed: {e}. Retrying in 5 seconds.")
                self.microphone_status = False
                self.is_listening = False
                time.sleep(5.0)

# Singleton instance
voice_service = VoiceService()
