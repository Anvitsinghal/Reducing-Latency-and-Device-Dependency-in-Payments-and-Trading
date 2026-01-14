"""
PlamPay – Gesture-Powered Biometric Payment System
Agent Gateway Service

Built by Team Charlizard | Innovate 3.O Hackathon 2026
MIT License
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import time
import uuid

app = Flask(__name__)
CORS(app)

# -------------------------------
# Mock In-Memory Biometric Store
# -------------------------------
PALM_DATABASE = {
    "user_001": np.random.rand(128),  # simulated palm embedding
}

SIMILARITY_THRESHOLD = 0.85


# -------------------------------
# Utility Functions
# -------------------------------
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def generate_transaction_id():
    return f"TXN-{uuid.uuid4().hex[:10].upper()}"


# -------------------------------
# Autonomous Agents (Simulated)
# -------------------------------
def biometric_verification_agent(palm_embedding):
    for user_id, stored_embedding in PALM_DATABASE.items():
        similarity = cosine_similarity(palm_embedding, stored_embedding)
        if similarity >= SIMILARITY_THRESHOLD:
            return True, user_id, similarity
    return False, None, 0.0


def gesture_analysis_agent(gesture):
    gesture_map = {
        "SWIPE_RIGHT": "INITIATE_PAYMENT",
        "CIRCLE": "EXECUTE_TRADE",
        "TAP": "CONFIRM",
        "SWIPE_LEFT": "CANCEL"
    }
    return gesture_map.get(gesture, "UNKNOWN")


def fraud_detection_agent(similarity_score, gesture_confidence):
    if similarity_score < 0.9 or gesture_confidence < 0.75:
        return False
    return True


# -------------------------------
# API Routes
# -------------------------------
@app.route("/api/transaction/process", methods=["POST"])
def process_transaction():
    start_time = time.time()
    data = request.json

    palm_embedding = np.array(data.get("palm_embedding"))
    gesture = data.get("gesture")
    gesture_confidence = data.get("gesture_confidence", 0.0)

    # 1. Biometric Verification
    verified, user_id, similarity = biometric_verification_agent(palm_embedding)
    if not verified:
        return jsonify({
            "status": "FAILED",
            "reason": "Palm authentication failed"
        }), 401

    # 2. Gesture Interpretation
    intent = gesture_analysis_agent(gesture)
    if intent == "UNKNOWN":
        return jsonify({
            "status": "FAILED",
            "reason": "Unrecognized gesture"
        }), 400

    # 3. Fraud & Risk Assessment
    allowed = fraud_detection_agent(similarity, gesture_confidence)
    if not allowed:
        return jsonify({
            "status": "BLOCKED",
            "reason": "Transaction flagged by risk engine"
        }), 403

    # 4. Execute Transaction
    transaction_id = generate_transaction_id()
    latency = round((time.time() - start_time) * 1000, 2)

    return jsonify({
        "status": "SUCCESS",
        "transaction_id": transaction_id,
        "user_id": user_id,
        "intent": intent,
        "biometric_similarity": round(similarity, 3),
        "latency_ms": latency
    })


# -------------------------------
# Health Check
# -------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "service": "PlamPay Agent Gateway",
        "status": "running",
        "agents_active": 5
    })


# -------------------------------
# App Runner
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
