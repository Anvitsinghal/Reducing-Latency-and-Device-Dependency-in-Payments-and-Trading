from flask import Blueprint, request, jsonify
from services.palm_auth_service import palm_auth_service
from models.user import User, user_repository
from utils.logger import logger

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    username = data.get('username')
    email = data.get('email')
    
    if not username or not email:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    existing_user = user_repository.get_by_email(email)
    if existing_user:
        return jsonify({'success': False, 'error': 'User already exists'}), 409
    
    user = User(username, email)
    user_repository.create(user)
    
    logger.info(f'User registered: {user.id}')
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/enroll-palm', methods=['POST'])
def enroll_palm():
    data = request.get_json()
    
    user_id = data.get('user_id')
    palm_data = data.get('palm_data')
    
    if not user_id or not palm_data:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = palm_auth_service.enroll_palm(user_id, palm_data)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@auth_bp.route('/verify-palm', methods=['POST'])
def verify_palm():
    data = request.get_json()
    
    user_id = data.get('user_id')
    palm_data = data.get('palm_data')
    
    if not user_id or not palm_data:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = palm_auth_service.verify_palm(user_id, palm_data)
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 401

@auth_bp.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = user_repository.get_by_id(user_id)
    
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/enrolled-users', methods=['GET'])
def get_enrolled_users():
    users = palm_auth_service.get_enrolled_users()
    
    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users],
        'count': len(users)
    }), 200
