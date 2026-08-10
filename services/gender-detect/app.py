"""
Kaafilla gender-detection microservice.

Wraps the OpenCV + Levi-Hassner (Adience) gender model from
https://github.com/smahesh29/Gender-and-Age-Detection behind a small HTTP API
the app calls during onboarding. It returns a *soft* signal only — the app
flags mismatches for human review, it does NOT hard-block, because this model
is known to misclassify real people (lighting/angle/androgynous features, and
trans/non-binary users have no correct label).

Contract:
  POST /detect-gender   header: X-Api-Key: <GENDER_API_KEY>
    body: { "image_url": "https://.../photo.jpg" }
    200:  { "gender": "women"|"men", "label": "Female"|"Male",
            "confidence": 0.87, "faces": 1 }
    200:  { "gender": null, "reason": "no_face" }   # couldn't find a face
  GET  /health -> { "ok": true }

The four model files are fetched from the source repo on first boot (see MODELS).
"""
import os
import urllib.request

import cv2
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

API_KEY = os.environ.get("GENDER_API_KEY", "")  # set this in your host's env
RAW = "https://raw.githubusercontent.com/smahesh29/Gender-and-Age-Detection/master/"
MODEL_DIR = os.environ.get("MODEL_DIR", "models")

# only the gender + face-detection models are needed (age is not used)
MODELS = [
    "opencv_face_detector.pbtxt",
    "opencv_face_detector_uint8.pb",
    "gender_deploy.prototxt",
    "gender_net.caffemodel",
]
MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)
GENDER_LABELS = ["Male", "Female"]  # net output order


def _ensure_models():
    os.makedirs(MODEL_DIR, exist_ok=True)
    for name in MODELS:
        dest = os.path.join(MODEL_DIR, name)
        if not os.path.exists(dest) or os.path.getsize(dest) == 0:
            app.logger.info("downloading model %s", name)
            urllib.request.urlretrieve(RAW + name, dest)


_ensure_models()
_face_net = cv2.dnn.readNet(
    os.path.join(MODEL_DIR, "opencv_face_detector_uint8.pb"),
    os.path.join(MODEL_DIR, "opencv_face_detector.pbtxt"),
)
_gender_net = cv2.dnn.readNet(
    os.path.join(MODEL_DIR, "gender_net.caffemodel"),
    os.path.join(MODEL_DIR, "gender_deploy.prototxt"),
)


def _largest_face(frame, conf=0.7):
    """Return the highest-confidence face box (x1,y1,x2,y2) or None."""
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), [104, 117, 123], True, False)
    _face_net.setInput(blob)
    detections = _face_net.forward()
    best, best_score = None, conf
    for i in range(detections.shape[2]):
        score = detections[0, 0, i, 2]
        if score >= best_score:
            best_score = score
            x1 = int(detections[0, 0, i, 3] * w)
            y1 = int(detections[0, 0, i, 4] * h)
            x2 = int(detections[0, 0, i, 5] * w)
            y2 = int(detections[0, 0, i, 6] * h)
            best = (max(0, x1), max(0, y1), min(w, x2), min(h, y2))
    return best


def _read_image(url):
    with urllib.request.urlopen(url, timeout=15) as resp:
        data = resp.read()
    arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.post("/detect-gender")
def detect_gender():
    if API_KEY and request.headers.get("X-Api-Key") != API_KEY:
        return jsonify(error="unauthorized"), 401
    body = request.get_json(silent=True) or {}
    url = body.get("image_url")
    if not url:
        return jsonify(error="image_url required"), 400
    try:
        frame = _read_image(url)
    except Exception:
        return jsonify(error="could not read image"), 400
    if frame is None:
        return jsonify(error="could not decode image"), 400

    box = _largest_face(frame)
    if box is None:
        return jsonify(gender=None, reason="no_face")

    x1, y1, x2, y2 = box
    pad = 20
    face = frame[max(0, y1 - pad):min(frame.shape[0], y2 + pad),
                 max(0, x1 - pad):min(frame.shape[1], x2 + pad)]
    blob = cv2.dnn.blobFromImage(face, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
    _gender_net.setInput(blob)
    preds = _gender_net.forward()[0]
    label = GENDER_LABELS[int(preds.argmax())]
    return jsonify(
        gender="women" if label == "Female" else "men",
        label=label,
        confidence=round(float(preds.max()), 4),
        faces=1,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
