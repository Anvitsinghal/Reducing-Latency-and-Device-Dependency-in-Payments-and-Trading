import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-plampay-2026')
    DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///plampay.db')
    API_VERSION = 'v1'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    PALM_AUTH_THRESHOLD = 0.85
    GESTURE_CONFIDENCE_MIN = 0.75
    TRANSACTION_TIMEOUT = 30
    SMOOTHING_WINDOW_SIZE = 5
    LATENCY_THRESHOLD_MS = 100
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']
    
class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
