import numpy as np
from utils.logger import logger
from utils.latency_monitor import measure_latency
from services.smoothing_service import smoothing_service

class GestureService:
    def __init__(self):
        self.gesture_types = {
            'swipe_right': 'payment',
            'swipe_left': 'cancel',
            'pinch': 'confirm',
            'spread': 'expand',
            'tap': 'select',
            'double_tap': 'quick_pay',
            'circle': 'trade'
        }
        self.confidence_threshold = 0.75
        self.gesture_history = []
    
    @measure_latency('gesture_processing')
    def process_gesture(self, gesture_data):
        logger.info('Processing gesture data')
        
        raw_points = gesture_data.get('points', [])
        if not raw_points:
            return {'success': False, 'error': 'No gesture points provided'}
        
        smoothed_points = smoothing_service.smooth_trajectory(raw_points)
        
        gesture_type = self._classify_gesture(smoothed_points)
        confidence = self._calculate_confidence(smoothed_points, gesture_type)
        
        if confidence < self.confidence_threshold:
            return {
                'success': False,
                'error': 'Low confidence',
                'confidence': confidence
            }
        
        action = self.gesture_types.get(gesture_type, 'unknown')
        
        result = {
            'success': True,
            'gesture_type': gesture_type,
            'action': action,
            'confidence': confidence,
            'smoothed_points': smoothed_points
        }
        
        self.gesture_history.append(result)
        
        return result
    
    def _classify_gesture(self, points):
        if len(points) < 2:
            return 'tap'
        
        start_point = points[0]
        end_point = points[-1]
        
        dx = end_point[0] - start_point[0]
        dy = end_point[1] - start_point[1]
        
        distance = np.sqrt(dx**2 + dy**2)
        
        if distance < 10:
            return 'tap'
        
        if abs(dx) > abs(dy) * 2:
            return 'swipe_right' if dx > 0 else 'swipe_left'
        
        if self._is_circular(points):
            return 'circle'
        
        if self._is_pinch(points):
            return 'pinch'
        
        return 'swipe_right'
    
    def _calculate_confidence(self, points, gesture_type):
        if len(points) < 2:
            return 0.6
        
        smoothness = self._calculate_smoothness(points)
        consistency = self._calculate_consistency(points, gesture_type)
        
        confidence = (smoothness * 0.4 + consistency * 0.6)
        
        return min(0.98, max(0.5, confidence))
    
    def _calculate_smoothness(self, points):
        if len(points) < 3:
            return 0.8
        
        angles = []
        for i in range(1, len(points) - 1):
            v1 = np.array(points[i]) - np.array(points[i-1])
            v2 = np.array(points[i+1]) - np.array(points[i])
            
            if np.linalg.norm(v1) > 0 and np.linalg.norm(v2) > 0:
                angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
                angles.append(angle)
        
        if not angles:
            return 0.8
        
        smoothness = np.mean(angles)
        return (smoothness + 1) / 2
    
    def _calculate_consistency(self, points, gesture_type):
        return 0.85
    
    def _is_circular(self, points):
        if len(points) < 8:
            return False
        
        center_x = np.mean([p[0] for p in points])
        center_y = np.mean([p[1] for p in points])
        
        distances = [np.sqrt((p[0] - center_x)**2 + (p[1] - center_y)**2) for p in points]
        std_dev = np.std(distances)
        mean_dist = np.mean(distances)
        
        return std_dev < mean_dist * 0.2
    
    def _is_pinch(self, points):
        if len(points) < 4:
            return False
        
        start_dist = np.linalg.norm(np.array(points[1]) - np.array(points[0]))
        end_dist = np.linalg.norm(np.array(points[-1]) - np.array(points[-2]))
        
        return end_dist < start_dist * 0.5
    
    def get_gesture_history(self, limit=10):
        return self.gesture_history[-limit:]

gesture_service = GestureService()
