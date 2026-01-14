import numpy as np
from collections import deque
from utils.logger import logger
from utils.latency_monitor import measure_latency

class GestureClassifier:
    def __init__(self, history_size=10, confidence_threshold=0.75):
        self.history_size = history_size
        self.confidence_threshold = confidence_threshold
        self.gesture_history = deque(maxlen=history_size)
        
        self.gesture_templates = {
            'swipe_right': {'direction': 'horizontal', 'sign': 1, 'min_distance': 0.15},
            'swipe_left': {'direction': 'horizontal', 'sign': -1, 'min_distance': 0.15},
            'swipe_up': {'direction': 'vertical', 'sign': -1, 'min_distance': 0.15},
            'swipe_down': {'direction': 'vertical', 'sign': 1, 'min_distance': 0.15},
            'pinch': {'type': 'distance_decrease', 'min_ratio': 0.5},
            'spread': {'type': 'distance_increase', 'min_ratio': 1.5},
            'tap': {'type': 'static', 'max_movement': 0.02},
            'circle': {'type': 'circular', 'min_points': 8},
            'palm_open': {'type': 'hand_state', 'fingers_extended': 4},
            'fist': {'type': 'hand_state', 'fingers_extended': 0}
        }
    
    @measure_latency('gesture_classification')
    def classify_gesture(self, trajectory_points, hand_data=None):
        if not trajectory_points or len(trajectory_points) < 2:
            return self._classify_static_gesture(hand_data)
        
        gesture_type = None
        confidence = 0.0
        
        swipe_result = self._detect_swipe(trajectory_points)
        if swipe_result['detected']:
            gesture_type = swipe_result['type']
            confidence = swipe_result['confidence']
        
        if not gesture_type:
            circle_result = self._detect_circle(trajectory_points)
            if circle_result['detected']:
                gesture_type = 'circle'
                confidence = circle_result['confidence']
        
        if not gesture_type:
            pinch_spread_result = self._detect_pinch_spread(trajectory_points)
            if pinch_spread_result['detected']:
                gesture_type = pinch_spread_result['type']
                confidence = pinch_spread_result['confidence']
        
        if not gesture_type:
            gesture_type = 'unknown'
            confidence = 0.0
        
        result = {
            'gesture_type': gesture_type,
            'confidence': confidence,
            'is_valid': confidence >= self.confidence_threshold,
            'trajectory_length': len(trajectory_points)
        }
        
        self.gesture_history.append(result)
        
        return result
    
    def _classify_static_gesture(self, hand_data):
        if not hand_data:
            return {
                'gesture_type': 'none',
                'confidence': 0.0,
                'is_valid': False
            }
        
        if self._is_palm_open(hand_data):
            return {
                'gesture_type': 'palm_open',
                'confidence': 0.9,
                'is_valid': True
            }
        elif self._is_fist(hand_data):
            return {
                'gesture_type': 'fist',
                'confidence': 0.85,
                'is_valid': True
            }
        else:
            return {
                'gesture_type': 'tap',
                'confidence': 0.7,
                'is_valid': True
            }
    
    def _detect_swipe(self, points):
        start = np.array(points[0][:2])
        end = np.array(points[-1][:2])
        
        displacement = end - start
        distance = np.linalg.norm(displacement)
        
        if distance < 0.1:
            return {'detected': False}
        
        dx, dy = displacement
        
        if abs(dx) > abs(dy) * 1.5:
            gesture_type = 'swipe_right' if dx > 0 else 'swipe_left'
            confidence = min(0.95, 0.7 + (abs(dx) / (abs(dy) + 0.01)) * 0.1)
        elif abs(dy) > abs(dx) * 1.5:
            gesture_type = 'swipe_up' if dy < 0 else 'swipe_down'
            confidence = min(0.95, 0.7 + (abs(dy) / (abs(dx) + 0.01)) * 0.1)
        else:
            return {'detected': False}
        
        linearity = self._calculate_linearity(points)
        confidence *= linearity
        
        return {
            'detected': True,
            'type': gesture_type,
            'confidence': confidence
        }
    
    def _calculate_linearity(self, points):
        if len(points) < 3:
            return 1.0
        
        points_array = np.array([p[:2] for p in points])
        
        start = points_array[0]
        end = points_array[-1]
        
        line_vec = end - start
        line_length = np.linalg.norm(line_vec)
        
        if line_length < 1e-6:
            return 0.5
        
        deviations = []
        for point in points_array[1:-1]:
            point_vec = point - start
            projection = np.dot(point_vec, line_vec) / (line_length ** 2) * line_vec
            deviation = np.linalg.norm(point_vec - projection)
            deviations.append(deviation)
        
        avg_deviation = np.mean(deviations) if deviations else 0
        linearity = 1.0 / (1.0 + avg_deviation * 10)
        
        return linearity
    
    def _detect_circle(self, points):
        if len(points) < 8:
            return {'detected': False}
        
        points_array = np.array([p[:2] for p in points])
        
        center = np.mean(points_array, axis=0)
        
        distances = [np.linalg.norm(p - center) for p in points_array]
        avg_distance = np.mean(distances)
        std_distance = np.std(distances)
        
        circularity = 1.0 - min(1.0, std_distance / (avg_distance + 1e-6))
        
        if circularity < 0.7:
            return {'detected': False}
        
        angles = []
        for i in range(len(points_array) - 1):
            vec = points_array[i] - center
            angle = np.arctan2(vec[1], vec[0])
            angles.append(angle)
        
        angle_coverage = max(angles) - min(angles)
        
        if angle_coverage < np.pi:
            return {'detected': False}
        
        confidence = (circularity + min(1.0, angle_coverage / (2 * np.pi))) / 2
        
        return {
            'detected': True,
            'confidence': confidence
        }
    
    def _detect_pinch_spread(self, points):
        if len(points) < 4:
            return {'detected': False}
        
        start_distances = []
        end_distances = []
        
        for i in range(min(3, len(points) // 4)):
            if len(points[i]) >= 2:
                start_distances.append(np.linalg.norm(np.array(points[i][:2])))
        
        for i in range(max(0, len(points) - 3), len(points)):
            if len(points[i]) >= 2:
                end_distances.append(np.linalg.norm(np.array(points[i][:2])))
        
        if not start_distances or not end_distances:
            return {'detected': False}
        
        avg_start = np.mean(start_distances)
        avg_end = np.mean(end_distances)
        
        ratio = avg_end / (avg_start + 1e-6)
        
        if ratio < 0.6:
            gesture_type = 'pinch'
            confidence = min(0.95, 0.7 + (0.6 - ratio) * 0.5)
            return {
                'detected': True,
                'type': gesture_type,
                'confidence': confidence
            }
        elif ratio > 1.4:
            gesture_type = 'spread'
            confidence = min(0.95, 0.7 + (ratio - 1.4) * 0.3)
            return {
                'detected': True,
                'type': gesture_type,
                'confidence': confidence
            }
        
        return {'detected': False}
    
    def _is_palm_open(self, hand_data):
        if 'landmarks' not in hand_data:
            return False
        
        landmarks = hand_data['landmarks']
        
        finger_tips = [8, 12, 16, 20]
        finger_pips = [6, 10, 14, 18]
        
        extended_count = 0
        for tip_idx, pip_idx in zip(finger_tips, finger_pips):
            if tip_idx < len(landmarks) and pip_idx < len(landmarks):
                if landmarks[tip_idx]['y'] < landmarks[pip_idx]['y']:
                    extended_count += 1
        
        return extended_count >= 3
    
    def _is_fist(self, hand_data):
        if 'landmarks' not in hand_data:
            return False
        
        landmarks = hand_data['landmarks']
        
        finger_tips = [8, 12, 16, 20]
        palm_center_idx = 9
        
        if palm_center_idx >= len(landmarks):
            return False
        
        palm_center = landmarks[palm_center_idx]
        
        closed_count = 0
        for tip_idx in finger_tips:
            if tip_idx < len(landmarks):
                tip = landmarks[tip_idx]
                distance = np.sqrt(
                    (tip['x'] - palm_center['x'])**2 +
                    (tip['y'] - palm_center['y'])**2
                )
                if distance < 0.1:
                    closed_count += 1
        
        return closed_count >= 3
    
    def get_gesture_sequence(self, window_size=5):
        if len(self.gesture_history) < window_size:
            return None
        
        recent_gestures = list(self.gesture_history)[-window_size:]
        gesture_types = [g['gesture_type'] for g in recent_gestures]
        
        return {
            'sequence': gesture_types,
            'pattern': '->'.join(gesture_types)
        }
    
    def detect_compound_gesture(self):
        sequence = self.get_gesture_sequence(3)
        
        if not sequence:
            return None
        
        pattern = sequence['pattern']
        
        compound_gestures = {
            'swipe_right->tap->swipe_right': 'quick_pay',
            'circle->tap': 'confirm_trade',
            'palm_open->fist': 'cancel',
            'swipe_up->swipe_down': 'refresh'
        }
        
        return compound_gestures.get(pattern)
    
    def reset_history(self):
        self.gesture_history.clear()

gesture_classifier = GestureClassifier()
