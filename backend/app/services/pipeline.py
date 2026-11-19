import cv2
import numpy as np
import json
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from app.config import settings
from app.services.face_analysis import analyze_facial_skin
from app.services.teeth_analysis import analyze_teeth
from app.services.hand_nail_analysis import analyze_nails

client = genai.Client(api_key=settings.GEMINI_API_KEY)


class DetectionItem(BaseModel):
    region: str = Field(..., description="Target region such as Face / Cheeks, Teeth / Mouth, or Hands / Nails")
    condition: str = Field(..., description="Observed visual finding or Normal / Clear Scan")
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommendation: str = Field(..., description="Actionable self-care step plus when to consult a professional")
    box: List[float] = Field(default=[0.2, 0.2, 0.8, 0.8], min_length=4, max_length=4)


def assess_frame_quality(frame: np.ndarray) -> dict:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return {
        "mean_brightness": round(brightness, 1),
        "sharpness_score": round(laplacian_var, 1),
        "is_low_light": bool(brightness < 55),
        "is_blurry": bool(laplacian_var < 40),
    }


def analyze_image_frame(frame: np.ndarray) -> list[dict]:
    try:
        quality_metrics = assess_frame_quality(frame)
        face_metrics = analyze_facial_skin(frame)
        teeth_metrics = analyze_teeth(frame)
        nail_metrics = analyze_nails(frame)

        success, encoded_image = cv2.imencode(".jpg", frame)
        if not success:
            return [
                DetectionItem(
                    region="System",
                    condition="Frame Encoding Error",
                    confidence=0.0,
                    recommendation="Could not encode webcam frame. Try capturing again.",
                    box=[0.2, 0.2, 0.8, 0.8],
                ).model_dump()
            ]

        prompt = f"""
        You are Facey, a personal wellness and hygiene visual screening assistant (not a medical doctor).
        Analyze the webcam frame using these local computer vision signals:
        - Frame Quality: {json.dumps(quality_metrics)}
        - Facial Skin Metrics: {json.dumps(face_metrics)}
        - Teeth Metrics: {json.dumps(teeth_metrics)}
        - Nail Metrics: {json.dumps(nail_metrics)}

        Guidelines:
        - Check visible facial skin (redness, acne, pigmentation), teeth/mouth (surface staining/yellowness), and hands/nails (nail color/surface changes) when visible.
        - Describe visual observations without diagnosing disease or inferring findings outside the frame.
        - If lighting is poor or a region is unclear, note that in the recommendation and lower confidence accordingly.
        - Provide practical daily hygiene/self-care steps. For persistent, painful, worsening, or spreading concerns, recommend a qualified professional: a dermatologist for skin, a dentist for teeth, or a healthcare professional for nails or other concerns.
        - Return normalized [ymin, xmin, ymax, xmax] coordinates (0.0 to 1.0) for each finding.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=encoded_image.tobytes(), mime_type="image/jpeg"),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[DetectionItem],
                temperature=0.2,
            ),
        )

        parsed = json.loads(response.text)
        validated = [DetectionItem(**item).model_dump() for item in parsed]
        return validated if validated else [
            DetectionItem(
                region="General",
                condition="Normal / Clear Scan",
                confidence=0.95,
                recommendation="No notable visual concerns detected. Keep up daily hygiene and consult a professional if symptoms develop.",
                box=[0.2, 0.2, 0.8, 0.8],
            ).model_dump()
        ]

    except Exception as e:
        print(f"Pipeline Error: {e}")
        return [
            DetectionItem(
                region="System",
                condition="Fallback Screening Notice",
                confidence=1.0,
                recommendation=f"Automated analysis hit a fallback state ({str(e)}). Check lighting, API configuration, or consult a healthcare professional for personal health concerns.",
                box=[0.2, 0.2, 0.8, 0.8],
            ).model_dump()
        ]