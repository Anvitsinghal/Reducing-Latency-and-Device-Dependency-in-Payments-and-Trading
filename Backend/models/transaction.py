from datetime import datetime
import uuid

class Transaction:
    def __init__(self, user_id, transaction_type, amount, currency='USD'):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.transaction_type = transaction_type
        self.amount = amount
        self.currency = currency
        self.status = 'pending'
        self.created_at = datetime.utcnow()
        self.completed_at = None
        self.gesture_trigger = None
        self.latency_ms = 0
        self.metadata = {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'gesture_trigger': self.gesture_trigger,
            'latency_ms': self.latency_ms,
            'metadata': self.metadata
        }
    
    def complete(self):
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        self.latency_ms = (self.completed_at - self.created_at).total_seconds() * 1000
    
    def fail(self, reason):
        self.status = 'failed'
        self.metadata['failure_reason'] = reason
        self.completed_at = datetime.utcnow()
    
    def set_gesture_trigger(self, gesture_type):
        self.gesture_trigger = gesture_type

class TransactionRepository:
    def __init__(self):
        self.transactions = {}
    
    def create(self, transaction):
        self.transactions[transaction.id] = transaction
        return transaction
    
    def get_by_id(self, transaction_id):
        return self.transactions.get(transaction_id)
    
    def get_by_user(self, user_id):
        return [t for t in self.transactions.values() if t.user_id == user_id]
    
    def get_pending(self, user_id):
        return [t for t in self.transactions.values() 
                if t.user_id == user_id and t.status == 'pending']
    
    def update(self, transaction):
        if transaction.id in self.transactions:
            self.transactions[transaction.id] = transaction
            return transaction
        return None
    
    def get_all(self):
        return list(self.transactions.values())

transaction_repository = TransactionRepository()
