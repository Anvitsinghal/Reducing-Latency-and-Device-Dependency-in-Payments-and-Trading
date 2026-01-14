from flask import Blueprint, request, jsonify
from services.transaction_service import transaction_service
from utils.logger import logger

transaction_bp = Blueprint('transaction', __name__, url_prefix='/api/transaction')

@transaction_bp.route('/payment', methods=['POST'])
def create_payment():
    data = request.get_json()
    
    user_id = data.get('user_id')
    amount = data.get('amount')
    currency = data.get('currency', 'USD')
    gesture_type = data.get('gesture_type')
    
    if not user_id or not amount:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = transaction_service.create_payment(user_id, amount, currency, gesture_type)
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@transaction_bp.route('/trade', methods=['POST'])
def create_trade():
    data = request.get_json()
    
    user_id = data.get('user_id')
    asset = data.get('asset')
    amount = data.get('amount')
    trade_type = data.get('trade_type', 'buy')
    gesture_type = data.get('gesture_type')
    
    if not user_id or not asset or not amount:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = transaction_service.create_trade(user_id, asset, amount, trade_type, gesture_type)
    
    if result['success']:
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@transaction_bp.route('/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    result = transaction_service.get_transaction(transaction_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 404

@transaction_bp.route('/user/<user_id>', methods=['GET'])
def get_user_transactions(user_id):
    result = transaction_service.get_user_transactions(user_id)
    
    return jsonify(result), 200

@transaction_bp.route('/<transaction_id>/cancel', methods=['POST'])
def cancel_transaction(transaction_id):
    result = transaction_service.cancel_transaction(transaction_id)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@transaction_bp.route('/stats', methods=['GET'])
def get_transaction_stats():
    from models.transaction import transaction_repository
    
    all_transactions = transaction_repository.get_all()
    
    total = len(all_transactions)
    completed = len([t for t in all_transactions if t.status == 'completed'])
    pending = len([t for t in all_transactions if t.status == 'pending'])
    failed = len([t for t in all_transactions if t.status == 'failed'])
    
    total_volume = sum(t.amount for t in all_transactions if t.status == 'completed')
    
    return jsonify({
        'success': True,
        'stats': {
            'total': total,
            'completed': completed,
            'pending': pending,
            'failed': failed,
            'total_volume': total_volume,
            'success_rate': (completed / total * 100) if total > 0 else 0
        }
    }), 200
