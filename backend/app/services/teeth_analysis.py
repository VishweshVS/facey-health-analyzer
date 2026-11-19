import cv2
import numpy as np

def analyze_teeth(frame: np.ndarray) -> dict:
    h, w, _ = frame.shape
    mouth_roi = frame[int(h*0.55):int(h*0.75), int(w*0.4):int(w*0.6)]
    
    if mouth_roi.size == 0:
        return {"status": "skipped", "reason": "Invalid ROI"}

    lab = cv2.cvtColor(mouth_roi, cv2.COLOR_BGR2LAB)
    _, _, b_channel = cv2.split(lab)
    mean_yellowness = float(np.mean(b_channel))

    return {
        "region": "Teeth / Mouth",
        "yellowness_score": round(float(mean_yellowness), 2),
        "potential_staining": bool(mean_yellowness > 135)  # Explicitly cast to native Python bool
    }