from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from routes.auth_routes import auth_bp
from routes.gesture_routes import gesture_bp
from routes.transaction_routes import transaction_bp
from utils.logger import logger
from utils.latency_monitor import monitor

app = Flask(__name__)

env = 'development'
app.config.from_object(config[env])

CORS(app, origins=app.config['CORS_ORIGINS'])

app.register_blueprint(auth_bp)
app.register_blueprint(gesture_bp)
app.register_blueprint(transaction_bp)

@app.route('/')
def index():
    return jsonify({
        'service': 'PlamPay API',
        'version': app.config['API_VERSION'],
        'status': 'running'
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'latency_stats': monitor.get_stats()
    })

@app.route('/api/stats')
def api_stats():
    return jsonify({
        'success': True,
        'latency': monitor.get_stats(),
        'operations': {
            op: monitor.get_operation_average(op)
            for op in ['palm_enrollment', 'palm_verification', 'gesture_processing', 'create_payment', 'create_trade']
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {error}')
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info('Starting PlamPay API server')
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
