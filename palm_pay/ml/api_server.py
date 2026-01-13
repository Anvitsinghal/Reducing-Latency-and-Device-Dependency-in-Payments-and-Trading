from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
from inference import BiometricAuthenticator
import uvicorn

app = FastAPI(
    title="PalmPay ML API",
    description="Biometric Authentication ML Service",
    version="2.1.0"
)

authenticator = BiometricAuthenticator()

class AuthRequest(BaseModel):
    features: List[float]
    threshold: float = 0.85

class VerifyRequest(BaseModel):
    features: List[float]
    user_id: int
    threshold: float = 0.85

@app.get("/")
def root():
    return {
        "service": "PalmPay ML API",
        "version": "2.1.0",
        "status": "running"
    }

@app.post("/authenticate")
def authenticate(request: AuthRequest):
    if len(request.features) != 37:
        raise HTTPException(
            status_code=400,
            detail="Expected 37 features"
        )
    
    result = authenticator.authenticate(
        request.features,
        request.threshold
    )
    
    return result

@app.post("/verify")
def verify(request: VerifyRequest):
    if len(request.features) != 37:
        raise HTTPException(
            status_code=400,
            detail="Expected 37 features"
        )
    
    result = authenticator.verify(
        request.features,
        request.user_id,
        request.threshold
    )
    
    return result

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
