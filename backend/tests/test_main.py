import pytest
from app.core import security
from app.services.ai_engine import ai_engine

class MockLandmark:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

def test_password_hashing():
    password = "secretpassword"
    hashed = security.get_password_hash(password)
    assert hashed != password
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrongpassword", hashed) is False

def test_token_creation():
    username = "testuser"
    token = security.create_access_token(username)
    assert isinstance(token, str)
    assert len(token) > 0

def test_ear_calculation():
    # Setup coordinates: [inner, outer, upper, lower]
    # In horizontal state (open eye):
    # inner = (0.2, 0.5), outer = (0.8, 0.5) => horizontal_dist = 0.6
    # upper = (0.5, 0.3), lower = (0.5, 0.7) => vertical_dist = 0.4
    # EAR = 0.4 / 0.6 = 0.666
    landmarks = [
        MockLandmark(0.2, 0.5), # inner
        MockLandmark(0.8, 0.5), # outer
        MockLandmark(0.5, 0.3), # upper
        MockLandmark(0.5, 0.7)  # lower
    ]
    # map indices: 0, 1, 2, 3
    ear = ai_engine._calculate_ear(landmarks, [0, 1, 2, 3])
    assert pytest.approx(ear, 0.01) == 0.666
    
    # In closed eye:
    # upper = (0.5, 0.49), lower = (0.5, 0.51) => vertical_dist = 0.02
    # EAR = 0.02 / 0.6 = 0.0333
    closed_landmarks = [
        MockLandmark(0.2, 0.5),
        MockLandmark(0.8, 0.5),
        MockLandmark(0.5, 0.49),
        MockLandmark(0.5, 0.51)
    ]
    ear_closed = ai_engine._calculate_ear(closed_landmarks, [0, 1, 2, 3])
    assert pytest.approx(ear_closed, 0.01) == 0.0333
    assert ear_closed < 0.20 # Should trigger blink threshold
