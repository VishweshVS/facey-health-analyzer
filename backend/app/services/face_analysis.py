import cv2
import numpy as np

def analyze_facial_skin(frame: np.ndarray) -> dict:
    h, w, _ = frame.shape
    face_roi = frame[int(h*0.2):int(h*0.7), int(w*0.3):int(w*0.7)]
    
    if face_roi.size == 0:
        return {"status": "skipped", "reason": "Invalid ROI"}

    hsv = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)
    red_mask = cv2.inRange(hsv, np.array([0, 40, 50]), np.array([12, 255, 255]))
    red_ratio = float(np.sum(red_mask > 0) / face_roi.size)

    return {
        "region": "Face / Cheeks",
        "redness_index": round(float(red_ratio), 4),
        "has_inflammation": bool(red_ratio > 0.03)  # Explicitly cast to native Python bool
    }