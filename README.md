# InSight – AI Vision Software for Human–Computer Interaction

> AI-powered hands-free computer interaction using eye tracking, head tracking, blink detection, and voice commands for accessible and intuitive computer control.

<br>

## 📖 Overview

**InSight** is an AI-powered assistive software that enables users to control a computer without using a keyboard or mouse. Using only a standard webcam and microphone, the system tracks eye movements, head movements, facial landmarks, and voice commands to provide a seamless hands-free experience.

The project is primarily designed for people with physical disabilities or limited mobility but can also be used by anyone seeking touch-free computer interaction.

<br>

## ✨ Features

- 👁️ Real-time eye tracking
- 🎯 Gaze-controlled cursor movement
- 🙂 Head movement tracking
- 😉 Blink detection for mouse clicks
- ⏳ Dwell-click functionality
- 🎙️ Voice command recognition
- ⚙️ AI-based gaze calibration
- 📹 Live webcam feed
- 📊 User-friendly dashboard
- ♿ Accessibility-focused design
- 💻 No specialized hardware required

<br>

## 🚀 Technologies Used

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite

### AI & Computer Vision
- OpenCV
- MediaPipe Face Mesh
- PyAutoGUI
- SpeechRecognition

<br>

## 🖥️ Local Installation Guide

### Prerequisites

Install the following before starting:

- Python 3.12 (Recommended)
- Node.js (LTS)
- npm
- Git
- Visual Studio Code (Optional)

### Clone the Repository

```bash
git clone https://github.com/tehzeeb-kousarr/InSight.git

cd InSight
```

<br>

## Frontend Setup

Navigate to the frontend folder.

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Run the development server.

```bash
npm run dev
```

Open your browser.

```
http://localhost:5173
```

<br>

## Backend Setup

Open another terminal.

Navigate to the backend folder.

```bash
cd backend
```

Create a virtual environment.

```bash
python -m venv venv
```

Activate it.

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

Upgrade pip.

```bash
python -m pip install --upgrade pip
```

Install project dependencies.

```bash
pip install -r requirements.txt
```

Install additional required packages.

```bash
pip install "pydantic[email]"
pip install "python-jose[cryptography]"
```

Run the FastAPI server.

```bash
uvicorn app.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

API Documentation:

```
http://127.0.0.1:8000/docs
```

## 🐳 Docker

Build and start the application.

```bash
docker-compose up --build
```

<br>

## 🎯 Problem Statement

Many individuals with physical disabilities face challenges when using traditional input devices such as keyboards and mice. Commercial eye-tracking systems are often expensive and require specialized hardware.

**InSight** addresses this problem by providing an affordable, software-based solution that works with a standard webcam and microphone.

<br>

## 🎯 Objectives

- Implement real-time eye tracking.
- Detect head movement accurately.
- Estimate user gaze direction.
- Perform blink-based clicking.
- Implement dwell-click interaction.
- Recognize voice commands.
- Execute computer actions automatically.
- Improve accessibility through AI.

<br>

## ⚙️ System Workflow

```
User
   │
   ▼
Webcam & Microphone
   │
   ▼
MediaPipe + OpenCV
   │
   ▼
Eye Tracking
Head Tracking
Face Detection
Voice Recognition
   │
   ▼
AI Decision Engine
   │
   ▼
Blink & Dwell Detection
   │
   ▼
Cursor Movement
Mouse Click
Keyboard Actions
   │
   ▼
User Interface
```

<br>

## 💡 Applications

- Assistive technology
- Healthcare
- Hands-free computer interaction
- Accessibility software
- Smart assistive devices
- Educational environments
- Remote computer control
- Touchless public systems

<br>

## 🌟 Benefits

- Hands-free computer control
- Affordable alternative to commercial eye trackers
- Easy to deploy
- Real-time AI processing
- Improves independence
- Uses only a webcam and microphone
- No specialized hardware required

<br>

## 🔮 Future Enhancements

- Deep learning-based gaze estimation
- Multi-language voice recognition
- Eye-controlled virtual keyboard
- Emotion detection
- Fatigue detection
- Wheelchair integration
- IoT device control
- Mobile application
- Cloud synchronization
- Personalized AI calibration

<br>

## 📌 Expected Outcome

The completed system enables users to:

- Move the cursor using eye and head movements.
- Click using blinks or dwell time.
- Execute commands using voice.
- Open applications.
- Browse the internet.
- Interact with software completely hands-free.

<br>

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature-name
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push to GitHub.

```bash
git push origin feature-name
```

5. Open a Pull Request.

<br>

## 📄 License

This project is intended for educational and research purposes.

<br>

### 👥 Team

Developed as part of an DYLP Vibe Coding Hackathon project focused on accessible Human–Computer Interaction (HCI).
