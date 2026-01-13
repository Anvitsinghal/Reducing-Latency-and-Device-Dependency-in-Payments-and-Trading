import numpy as np
import tensorflow as tf
from tensorflow import keras
import pickle
import json
import time

class BiometricAuthenticator:
    def __init__(self, model_path='models/'):
        self.model = keras.models.load_model(f'{model_path}palm_biometric_model.h5')
        
        with open(f'{model_path}scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
        
        with open(f'{model_path}config.json', 'r') as f:
            self.config = json.load(f)
        
        print(f"✅ Model loaded - Version {self.config['model_version']}")
    
    def authenticate(self, features, threshold=0.85):
        start_time = time.time()
        
        features_scaled = self.scaler.transform([features])
        predictions = self.model.predict(features_scaled, verbose=0)
        
        user_id = np.argmax(predictions[0])
        confidence = float(predictions[0][user_id])
        
        inference_time = (time.time() - start_time) * 1000
        
        result = {
            'authenticated': confidence >= threshold,
            'user_id': int(user_id),
            'confidence': confidence,
            'threshold': threshold,
            'inference_time_ms': round(inference_time, 2)
        }
        
        return result
    
    def verify(self, features, claimed_user_id, threshold=0.85):
        auth_result = self.authenticate(features, threshold)
        
        verified = (auth_result['user_id'] == claimed_user_id and 
                   auth_result['authenticated'])
        
        return {
            'verified': verified,
            'confidence': auth_result['confidence'],
            'inference_time_ms': auth_result['inference_time_ms']
        }

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

def euclidean_distance(vec1, vec2):
    return np.linalg.norm(np.array(vec1) - np.array(vec2))

if __name__ == '__main__':
    authenticator = BiometricAuthenticator()
    test_features = np.random.rand(37)
    
    result = authenticator.authenticate(test_features)
    print(f"\nAuthentication Result:")
    print(f"Authenticated: {result['authenticated']}")
    print(f"User ID: {result['user_id']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"Inference Time: {result['inference_time_ms']}ms")
