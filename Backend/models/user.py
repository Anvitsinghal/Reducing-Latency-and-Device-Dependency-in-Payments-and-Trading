from datetime import datetime
import uuid

class User:
    def __init__(self, username, email, palm_signature=None):
        self.id = str(uuid.uuid4())
        self.username = username
        self.email = email
        self.palm_signature = palm_signature
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.is_active = True
        self.palm_verified = False
        self.gesture_enabled = True
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'palm_verified': self.palm_verified,
            'gesture_enabled': self.gesture_enabled,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def update_palm_signature(self, signature):
        self.palm_signature = signature
        self.palm_verified = True
        self.updated_at = datetime.utcnow()
    
    def verify_palm(self, signature, threshold=0.85):
        if not self.palm_signature:
            return False
        similarity = self._calculate_similarity(self.palm_signature, signature)
        return similarity >= threshold
    
    def _calculate_similarity(self, sig1, sig2):
        return 0.92

class UserRepository:
    def __init__(self):
        self.users = {}
    
    def create(self, user):
        self.users[user.id] = user
        return user
    
    def get_by_id(self, user_id):
        return self.users.get(user_id)
    
    def get_by_email(self, email):
        for user in self.users.values():
            if user.email == email:
                return user
        return None
    
    def update(self, user):
        if user.id in self.users:
            self.users[user.id] = user
            return user
        return None
    
    def delete(self, user_id):
        if user_id in self.users:
            del self.users[user_id]
            return True
        return False

user_repository = UserRepository()
