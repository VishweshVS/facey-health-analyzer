import cv2
import numpy as np

def analyze_nails(frame: np.ndarray) -> dict:
    h, w, _ = frame.shape
    hands_roi = frame[int(h*0.6):int(h*0.9), int(w*0.2):int(w*0.8)]
    
    if hands_roi.size == 0:
        return {"status": "skipped", "reason": "Invalid ROI"}

    hsv = cv2.cvtColor(hands_roi, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    mean_sat = float(np.mean(saturation))
    saturation_variation = float(np.std(saturation))

    return {
        "region": "Hands / Nails",
        "saturation_index": round(float(mean_sat), 2),
        "saturation_variation": round(saturation_variation, 2),
        "anomaly_detected": bool(mean_sat > 150.0 or saturation_variation > 45.0),
    }