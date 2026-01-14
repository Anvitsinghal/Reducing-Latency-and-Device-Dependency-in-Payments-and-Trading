from flask import Blueprint, request, jsonify
from services.gesture_service import gesture_service
from utils.logger import logger

gesture_bp = Blueprint('gesture', __name__, url_prefix='/api/gesture')

@gesture_bp.route('/process', methods=['POST'])
def process_gesture():
    data = request.get_json()
    
    gesture_data = data.get('gesture_data')
    
    if not gesture_data:
        return jsonify({'success': False, 'error': 'Missing gesture data'}), 400
    
    result = gesture_service.process_gesture(gesture_data)
    
    if result['success']:
        logger.info(f"Gesture processed: {result['gesture_type']}")
        return jsonify(result), 200
    else:
        return jsonify(result), 400

@gesture_bp.route('/history', methods=['GET'])
def get_gesture_history():
    limit = request.args.get('limit', 10, type=int)
    
    history = gesture_service.get_gesture_history(limit)
    
    return jsonify({
        'success': True,
        'history': history,
        'count': len(history)
    }), 200

@gesture_bp.route('/types', methods=['GET'])
def get_gesture_types():
    return jsonify({
        'success': True,
        'gesture_types': gesture_service.gesture_types,
        'threshold': gesture_service.confidence_threshold
    }), 200

@gesture_bp.route('/validate', methods=['POST'])
def validate_gesture():
    data = request.get_json()
    
    gesture_type = data.get('gesture_type')
    points = data.get('points', [])
    
    if not gesture_type or not points:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    result = gesture_service.process_gesture({'points': points})
    
    is_valid = (result['success'] and 
                result.get('gesture_type') == gesture_type and 
                result.get('confidence', 0) >= gesture_service.confidence_threshold)
    
    return jsonify({
        'success': True,
        'is_valid': is_valid,
        'detected_gesture': result.get('gesture_type'),
        'confidence': result.get('confidence', 0)
    }), 200
