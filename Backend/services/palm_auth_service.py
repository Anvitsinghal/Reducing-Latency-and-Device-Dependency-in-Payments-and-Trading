import hashlib
import json
from models.user import user_repository
from utils.logger import logger
from utils.latency_monitor import measure_latency

class PalmAuthService:
    def __init__(self):
        self.threshold = 0.85
        self.palm_cache = {}
    
    @measure_latency('palm_enrollment')
    def enroll_palm(self, user_id, palm_data):
        logger.info(f'Enrolling palm for user: {user_id}')
        
        user = user_repository.get_by_id(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        palm_signature = self._generate_palm_signature(palm_data)
        user.update_palm_signature(palm_signature)
        user_repository.update(user)
        
        self.palm_cache[user_id] = palm_signature
        
        return {
            'success': True,
            'message': 'Palm enrolled successfully',
            'user_id': user_id
        }
    
    @measure_latency('palm_verification')
    def verify_palm(self, user_id, palm_data):
        logger.info(f'Verifying palm for user: {user_id}')
        
        user = user_repository.get_by_id(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        if not user.palm_verified:
            return {'success': False, 'error': 'Palm not enrolled'}
        
        palm_signature = self._generate_palm_signature(palm_data)
        similarity = self._calculate_similarity(user.palm_signature, palm_signature)
        
        is_verified = similarity >= self.threshold
        
        return {
            'success': is_verified,
            'similarity': similarity,
            'threshold': self.threshold,
            'user_id': user_id
        }
    
    def _generate_palm_signature(self, palm_data):
        palm_features = self._extract_features(palm_data)
        signature = hashlib.sha256(json.dumps(palm_features).encode()).hexdigest()
        return signature
    
    def _extract_features(self, palm_data):
        features = {
            'palm_lines': palm_data.get('lines', []),
            'palm_width': palm_data.get('width', 0),
            'palm_height': palm_data.get('height', 0),
            'finger_lengths': palm_data.get('finger_lengths', []),
            'landmarks': palm_data.get('landmarks', [])
        }
        return features
    
    def _calculate_similarity(self, signature1, signature2):
        if signature1 == signature2:
            return 1.0
        
        matching_chars = sum(c1 == c2 for c1, c2 in zip(signature1, signature2))
        similarity = matching_chars / max(len(signature1), len(signature2))
        
        return min(0.95, max(0.75, similarity))
    
    def get_enrolled_users(self):
        users = user_repository.users.values()
        return [u for u in users if u.palm_verified]

palm_auth_service = PalmAuthService()
