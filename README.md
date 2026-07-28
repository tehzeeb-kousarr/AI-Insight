# InSight – AI Vision Software for Human–Computer Interaction

InSight is a production-ready, hands-free desktop control system designed to assist users with physical disabilities (e.g., ALS, RSI, motor impairments) to control their computers naturally. It operates using standard webcams and microphones with no external hardware.

## Features

1. **Eye Iris Gaze Tracking**: Map iris relative coordinates to screen pixel coordinates via a 5-point calibration model.
2. **Head Joystick Controller**: Translate relative head tilt (nose displacements) to cursor directions.
3. **Blink Mouse Clicks**: Classify eye closure durations:
   - **Single Blink** $\rightarrow$ Left Click
   - **Double Blink** $\rightarrow$ Double Click
   - **Long Blink** $\rightarrow$ Right Click
4. **Dwell Clicking**: Hover the pointer on a 15px area for 2.0s to trigger a click.
5. **Speech Commands**: Multi-threaded keyword-mapping recognition engine.
6. **Analytics Reports**: Plot CPU/RAM loads, audit click logs, and export PDF and Excel sheets.

---

## Folder Structure

```
insight/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, settings, reports, etc.)
│   │   ├── core/         # DB engine, JWT keys
│   │   ├── db/           # SQLAlchemy models & schemas
│   │   ├── services/     # MediaPipe, OpenCV, SpeechRecognition loops
│   │   └── main.py       # FastAPI application bootstrap
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py            # Local uvicorn script
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar layouts, Calibration wizard
│   │   ├── pages/        # Dashboard, Analytics, Settings, Profile
│   │   ├── services/     # Axios API bindings
│   │   └── App.tsx       # Router, Context configurations
│   ├── Dockerfile
│   ├── nginx.conf
│   └── tailwind.config.js
├── docker-compose.yml
├── run.bat               # Windows automatic startup script
└── README.md
```

---

## Local Startup (Recommended for Windows)

Since PyAutoGUI and PyAudio require native OS hardware hooks, running **natively** on your host Windows OS is recommended.

1. Double-click the `run.bat` script in the root directory.
   - It will verify Python 3.12+ and Node.js are installed.
   - It sets up a virtual environment (`backend/venv`).
   - Installs pip packages and npm libraries.
   - Launches both backend (FastAPI) and frontend (Vite React) in separate windows.
2. Open `http://localhost:5173` in your browser.
3. Register your account. (The first user registered is automatically assigned the **Admin** role).

---

## Docker Compose Setup

For isolated deployment validation, you can orchestrate containers using Docker Compose.

```bash
docker-compose up --build
```

- **Frontend Nginx server**: `http://localhost:80`
- **FastAPI OpenAPI docs**: `http://localhost:8000/docs`

> [!IMPORTANT]
> PyAutoGUI will simulate clicks inside the virtual display boundary of the docker container. Microphone access requires mounting local sound card devices.

---

## Running Automated Tests

To verify backend mathematics and security hashing:

1. Activate your virtual environment:
   ```bash
   cd backend
   venv\Scripts\activate
   ```
2. Install testing packages and execute pytest:
   ```bash
   pip install pytest
   pytest
   ```
