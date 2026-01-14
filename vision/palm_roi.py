import cv2
import numpy as np
from utils.logger import logger

class PalmROIExtractor:
    def __init__(self, padding_ratio=0.2):
        self.padding_ratio = padding_ratio
    
    def extract_palm_region(self, frame, hand_data):
        if not hand_data or 'landmarks' not in hand_data:
            return None
        
        landmarks = hand_data['landmarks']
        height, width = frame.shape[:2]
        
        palm_landmarks = self._get_palm_landmarks(landmarks)
        
        x_coords = [lm['pixel_x'] for lm in palm_landmarks]
        y_coords = [lm['pixel_y'] for lm in palm_landmarks]
        
        min_x = max(0, min(x_coords))
        max_x = min(width, max(x_coords))
        min_y = max(0, min(y_coords))
        max_y = min(height, max(y_coords))
        
        padding_x = int((max_x - min_x) * self.padding_ratio)
        padding_y = int((max_y - min_y) * self.padding_ratio)
        
        min_x = max(0, min_x - padding_x)
        max_x = min(width, max_x + padding_x)
        min_y = max(0, min_y - padding_y)
        max_y = min(height, max_y + padding_y)
        
        palm_roi = frame[min_y:max_y, min_x:max_x]
        
        return {
            'roi': palm_roi,
            'bbox': {
                'x': min_x,
                'y': min_y,
                'width': max_x - min_x,
                'height': max_y - min_y
            },
            'center': {
                'x': (min_x + max_x) // 2,
                'y': (min_y + max_y) // 2
            }
        }
    
    def _get_palm_landmarks(self, landmarks):
        palm_indices = [0, 1, 2, 5, 9, 13, 17]
        return [landmarks[i] for i in palm_indices if i < len(landmarks)]
    
    def normalize_palm_roi(self, palm_roi_data, target_size=(128, 128)):
        if palm_roi_data is None or palm_roi_data['roi'].size == 0:
            return None
        
        roi = palm_roi_data['roi']
        normalized = cv2.resize(roi, target_size, interpolation=cv2.INTER_AREA)
        
        return normalized
    
    def preprocess_palm(self, palm_roi):
        if palm_roi is None or palm_roi.size == 0:
            return None
        
        gray = cv2.cvtColor(palm_roi, cv2.COLOR_BGR2GRAY)
        
        equalized = cv2.equalizeHist(gray)
        
        denoised = cv2.fastNlMeansDenoising(equalized, None, 10, 7, 21)
        
        return denoised
    
    def extract_palm_mask(self, frame, hand_data):
        if not hand_data or 'landmarks' not in hand_data:
            return None
        
        landmarks = hand_data['landmarks']
        height, width = frame.shape[:2]
        
        mask = np.zeros((height, width), dtype=np.uint8)
        
        palm_points = []
        palm_indices = [0, 1, 2, 5, 9, 13, 17]
        
        for idx in palm_indices:
            if idx < len(landmarks):
                lm = landmarks[idx]
                palm_points.append([lm['pixel_x'], lm['pixel_y']])
        
        if len(palm_points) > 2:
            palm_points = np.array(palm_points, dtype=np.int32)
            cv2.fillConvexPoly(mask, palm_points, 255)
        
        return mask
    
    def extract_palm_with_mask(self, frame, hand_data):
        mask = self.extract_palm_mask(frame, hand_data)
        
        if mask is None:
            return None
        
        masked_palm = cv2.bitwise_and(frame, frame, mask=mask)
        
        return masked_palm
    
    def get_palm_orientation(self, hand_data):
        if not hand_data or 'landmarks' not in hand_data:
            return None
        
        landmarks = hand_data['landmarks']
        
        wrist = landmarks[0]
        middle_mcp = landmarks[9]
        
        dx = middle_mcp['x'] - wrist['x']
        dy = middle_mcp['y'] - wrist['y']
        
        angle = np.arctan2(dy, dx) * 180 / np.pi
        
        return {
            'angle': angle,
            'vector': {'dx': dx, 'dy': dy}
        }
    
    def rotate_palm_upright(self, palm_roi, orientation):
        if palm_roi is None or palm_roi.size == 0 or orientation is None:
            return palm_roi
        
        angle = orientation['angle']
        
        height, width = palm_roi.shape[:2]
        center = (width // 2, height // 2)
        
        rotation_matrix = cv2.getRotationMatrix2D(center, -angle, 1.0)
        
        rotated = cv2.warpAffine(palm_roi, rotation_matrix, (width, height))
        
        return rotated
    
    def extract_multiple_scales(self, palm_roi, scales=[0.5, 1.0, 1.5]):
        if palm_roi is None or palm_roi.size == 0:
            return []
        
        multi_scale_rois = []
        
        for scale in scales:
            height, width = palm_roi.shape[:2]
            new_size = (int(width * scale), int(height * scale))
            
            scaled = cv2.resize(palm_roi, new_size, interpolation=cv2.INTER_LINEAR)
            multi_scale_rois.append({
                'scale': scale,
                'roi': scaled
            })
        
        return multi_scale_rois

palm_roi_extractor = PalmROIExtractor()
