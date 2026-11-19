# Skin Health Analyzer

A webcam-based wellness screening application. The React frontend captures a frame, sends it to the Python API, and displays the returned observations and recommendations. It is intended for general self-care awareness, not diagnosis.

## Architecture

- **Frontend (`frontend/`)** — React and Vite provide the webcam interface, capture and display analyzed frames with highlighted regions, show results, save up to 20 recent scans in browser `localStorage`, and export a JSON summary.
- **Backend (`backend/`)** — FastAPI accepts uploaded images. OpenCV and NumPy support frame decoding and local image checks for skin, teeth, nails, and frame quality. The analysis pipeline sends the image and those signals to Google Gemini and validates its structured response.
- **Request flow** — The browser captures a JPEG and posts it as multipart form data to `POST /api/analyze-frame`. The API returns a `detections` array with `region`, `condition`, `confidence`, `recommendation`, and normalized bounding-box coordinates. The frontend plots the boxes on the captured image and shows the recommendations alongside it.

## Requirements

- Python with `pip`
- Node.js with `npm`
- A Google Gemini API key
- A browser with webcam access (production deployments must use HTTPS)

## Configure environment

Create `backend/.env`:

```env
GEMINI_API_KEY=your-google-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

`GEMINI_API_KEY` is used by the backend and must not be placed in frontend variables. `FRONTEND_URL` is the frontend's origin for CORS; local Vite origins are allowed by default. In production, set it to the deployed frontend origin, including `https://` and without a path.

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Set `VITE_API_URL` to the backend's base URL, without a trailing slash. Vite exposes `VITE_` variables in browser code, so never put secrets in them. Restart the Vite server after changing frontend environment variables.

The production build currently uses `https://facey-health-analyzer.onrender.com` from `frontend/.env.production`. If the backend URL changes, update that value or set `VITE_API_URL` in the frontend host's build environment.

## Run locally

Start the backend from the `backend/` directory:

```sh
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal, start the frontend from the `frontend/` directory:

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`) and grant camera permission. The backend health endpoint is `GET /`; frame analysis is available at `POST /api/analyze-frame`.

## Wellness disclaimer

This application provides general wellness and self-care screening only. Its image analysis and recommendations may be incomplete or incorrect; it does not diagnose conditions or replace professional medical advice. Contact a qualified healthcare professional about persistent, painful, worsening, or spreading concerns.
