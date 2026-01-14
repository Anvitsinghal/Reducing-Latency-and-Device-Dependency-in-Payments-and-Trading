import cv2
import mediapipe as mp
import numpy as np
from utils.logger import logger

class HandTracker:
    def __init__(self, max_hands=2, detection_confidence=0.7, tracking_confidence=0.5):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_hands,
            min_detection_confidence=detection_confidence,
            min_tracking_confidence=tracking_confidence
        )
        
        self.landmark_names = [
            'WRIST', 'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
            'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
            'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
            'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
            'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
        ]
    
    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        hands_data = []
        
        if results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                hand_data = self._extract_hand_data(hand_landmarks, frame.shape)
                
                if results.multi_handedness:
                    handedness = results.multi_handedness[idx].classification[0].label
                    hand_data['handedness'] = handedness
                
                hands_data.append(hand_data)
        
        return {
            'success': len(hands_data) > 0,
            'hands': hands_data,
            'count': len(hands_data)
        }
    
    def _extract_hand_data(self, hand_landmarks, frame_shape):
        height, width, _ = frame_shape
        
        landmarks = []
        for idx, landmark in enumerate(hand_landmarks.landmark):
            landmarks.append({
                'name': self.landmark_names[idx] if idx < len(self.landmark_names) else f'LANDMARK_{idx}',
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'pixel_x': int(landmark.x * width),
                'pixel_y': int(landmark.y * height)
            })
        
        return {
            'landmarks': landmarks,
            'raw_landmarks': hand_landmarks
        }
    
    def get_landmark_positions(self, hand_data):
        return [(lm['x'], lm['y'], lm['z']) for lm in hand_data['landmarks']]
    
    def get_pixel_positions(self, hand_data):
        return [(lm['pixel_x'], lm['pixel_y']) for lm in hand_data['landmarks']]
    
    def calculate_hand_center(self, hand_data):
        landmarks = hand_data['landmarks']
        avg_x = np.mean([lm['x'] for lm in landmarks])
        avg_y = np.mean([lm['y'] for lm in landmarks])
        avg_z = np.mean([lm['z'] for lm in landmarks])
        
        return {'x': avg_x, 'y': avg_y, 'z': avg_z}
    
    def get_finger_tips(self, hand_data):
        landmarks = hand_data['landmarks']
        tip_indices = [4, 8, 12, 16, 20]
        
        tips = {}
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        
        for idx, tip_idx in enumerate(tip_indices):
            if tip_idx < len(landmarks):
                tips[finger_names[idx]] = landmarks[tip_idx]
        
        return tips
    
    def calculate_palm_size(self, hand_data):
        landmarks = hand_data['landmarks']
        
        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        
        palm_length = np.sqrt(
            (middle_mcp['x'] - wrist['x'])**2 +
            (middle_mcp['y'] - wrist['y'])**2
        )
        
        index_mcp = landmarks[5]
        pinky_mcp = landmarks[17]
        
        palm_width = np.sqrt(
            (pinky_mcp['x'] - index_mcp['x'])**2 +
            (pinky_mcp['y'] - index_mcp['y'])**2
        )
        
        return {
            'length': palm_length,
            'width': palm_width,
            'area': palm_length * palm_width
        }
    
    def draw_landmarks(self, frame, hands_data):
        annotated_frame = frame.copy()
        
        for hand_data in hands_data:
            if 'raw_landmarks' in hand_data:
                self.mp_drawing.draw_landmarks(
                    annotated_frame,
                    hand_data['raw_landmarks'],
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
        
        return annotated_frame
    
    def is_palm_open(self, hand_data):
        landmarks = hand_data['landmarks']
        
        finger_tips = [8, 12, 16, 20]
        finger_pips = [6, 10, 14, 18]
        
        extended_count = 0
        for tip_idx, pip_idx in zip(finger_tips, finger_pips):
            if landmarks[tip_idx]['y'] < landmarks[pip_idx]['y']:
                extended_count += 1
        
        return extended_count >= 3
    
    def release(self):
        self.hands.close()

hand_tracker = HandTracker()
