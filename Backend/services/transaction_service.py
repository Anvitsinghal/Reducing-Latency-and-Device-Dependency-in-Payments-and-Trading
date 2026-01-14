import random
from models.transaction import Transaction, transaction_repository
from models.user import user_repository
from utils.logger import logger
from utils.latency_monitor import measure_latency

class TransactionService:
    def __init__(self):
        self.payment_providers = ['stripe', 'paypal', 'square']
        self.trading_platforms = ['binance', 'coinbase', 'kraken']
        self.transaction_limits = {
            'payment': 10000,
            'trade': 50000
        }
    
    @measure_latency('create_payment')
    def create_payment(self, user_id, amount, currency='USD', gesture_type=None):
        logger.info(f'Creating payment for user {user_id}: {amount} {currency}')
        
        user = user_repository.get_by_id(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        if not user.is_active:
            return {'success': False, 'error': 'User account is inactive'}
        
        if amount > self.transaction_limits['payment']:
            return {'success': False, 'error': 'Amount exceeds limit'}
        
        transaction = Transaction(user_id, 'payment', amount, currency)
        if gesture_type:
            transaction.set_gesture_trigger(gesture_type)
        
        transaction_repository.create(transaction)
        
        success = self._process_payment(transaction)
        
        if success:
            transaction.complete()
            transaction_repository.update(transaction)
            return {
                'success': True,
                'transaction_id': transaction.id,
                'amount': amount,
                'currency': currency,
                'status': 'completed'
            }
        else:
            transaction.fail('Payment processing failed')
            transaction_repository.update(transaction)
            return {'success': False, 'error': 'Payment failed'}
    
    @measure_latency('create_trade')
    def create_trade(self, user_id, asset, amount, trade_type='buy', gesture_type=None):
        logger.info(f'Creating trade for user {user_id}: {trade_type} {amount} {asset}')
        
        user = user_repository.get_by_id(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        if amount > self.transaction_limits['trade']:
            return {'success': False, 'error': 'Amount exceeds limit'}
        
        transaction = Transaction(user_id, 'trade', amount, asset)
        transaction.metadata['trade_type'] = trade_type
        transaction.metadata['asset'] = asset
        
        if gesture_type:
            transaction.set_gesture_trigger(gesture_type)
        
        transaction_repository.create(transaction)
        
        success = self._process_trade(transaction, trade_type)
        
        if success:
            transaction.complete()
            transaction_repository.update(transaction)
            return {
                'success': True,
                'transaction_id': transaction.id,
                'trade_type': trade_type,
                'asset': asset,
                'amount': amount,
                'status': 'completed'
            }
        else:
            transaction.fail('Trade execution failed')
            transaction_repository.update(transaction)
            return {'success': False, 'error': 'Trade failed'}
    
    def _process_payment(self, transaction):
        provider = random.choice(self.payment_providers)
        logger.info(f'Processing payment via {provider}')
        
        success_rate = 0.95
        return random.random() < success_rate
    
    def _process_trade(self, transaction, trade_type):
        platform = random.choice(self.trading_platforms)
        logger.info(f'Executing {trade_type} trade on {platform}')
        
        success_rate = 0.92
        return random.random() < success_rate
    
    def get_transaction(self, transaction_id):
        transaction = transaction_repository.get_by_id(transaction_id)
        if not transaction:
            return {'success': False, 'error': 'Transaction not found'}
        return {'success': True, 'transaction': transaction.to_dict()}
    
    def get_user_transactions(self, user_id):
        transactions = transaction_repository.get_by_user(user_id)
        return {
            'success': True,
            'transactions': [t.to_dict() for t in transactions]
        }
    
    def cancel_transaction(self, transaction_id):
        transaction = transaction_repository.get_by_id(transaction_id)
        if not transaction:
            return {'success': False, 'error': 'Transaction not found'}
        
        if transaction.status != 'pending':
            return {'success': False, 'error': 'Cannot cancel completed transaction'}
        
        transaction.fail('Cancelled by user')
        transaction_repository.update(transaction)
        
        return {'success': True, 'message': 'Transaction cancelled'}

transaction_service = TransactionService()
