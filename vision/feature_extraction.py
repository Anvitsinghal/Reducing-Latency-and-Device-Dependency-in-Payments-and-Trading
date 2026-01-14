import cv2
import numpy as np
from scipy.spatial import distance
from utils.logger import logger

class PalmFeatureExtractor:
    def __init__(self):
        self.sift = cv2.SIFT_create()
        self.orb = cv2.ORB_create()
    
    def extract_all_features(self, palm_roi, hand_data):
        features = {}
        
        features['geometric'] = self.extract_geometric_features(hand_data)
        features['texture'] = self.extract_texture_features(palm_roi)
        features['keypoints'] = self.extract_keypoint_features(palm_roi)
        features['palm_lines'] = self.extract_palm_lines(palm_roi)
        features['statistical'] = self.extract_statistical_features(palm_roi)
        
        return features
    
    def extract_geometric_features(self, hand_data):
        if not hand_data or 'landmarks' not in hand_data:
            return {}
        
        landmarks = hand_data['landmarks']
        
        finger_lengths = self._calculate_finger_lengths(landmarks)
        palm_dimensions = self._calculate_palm_dimensions(landmarks)
        finger_angles = self._calculate_finger_angles(landmarks)
        
        return {
            'finger_lengths': finger_lengths,
            'palm_dimensions': palm_dimensions,
            'finger_angles': finger_angles,
            'aspect_ratio': palm_dimensions['width'] / palm_dimensions['length'] if palm_dimensions['length'] > 0 else 0
        }
    
    def _calculate_finger_lengths(self, landmarks):
        finger_tips = [4, 8, 12, 16, 20]
        finger_bases = [2, 5, 9, 13, 17]
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        
        lengths = {}
        
        for name, tip_idx, base_idx in zip(finger_names, finger_tips, finger_bases):
            if tip_idx < len(landmarks) and base_idx < len(landmarks):
                tip = landmarks[tip_idx]
                base = landmarks[base_idx]
                
                length = np.sqrt(
                    (tip['x'] - base['x'])**2 +
                    (tip['y'] - base['y'])**2
                )
                lengths[name] = length
        
        return lengths
    
    def _calculate_palm_dimensions(self, landmarks):
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
    
    def _calculate_finger_angles(self, landmarks):
        finger_tips = [4, 8, 12, 16, 20]
        finger_mcps = [2, 5, 9, 13, 17]
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        
        angles = {}
        wrist = landmarks[0]
        
        for name, tip_idx, mcp_idx in zip(finger_names, finger_tips, finger_mcps):
            if tip_idx < len(landmarks) and mcp_idx < len(landmarks):
                tip = landmarks[tip_idx]
                mcp = landmarks[mcp_idx]
                
                v1 = np.array([mcp['x'] - wrist['x'], mcp['y'] - wrist['y']])
                v2 = np.array([tip['x'] - mcp['x'], tip['y'] - mcp['y']])
                
                if np.linalg.norm(v1) > 0 and np.linalg.norm(v2) > 0:
                    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
                    angle = np.arccos(np.clip(cos_angle, -1.0, 1.0)) * 180 / np.pi
                    angles[name] = angle
        
        return angles
    
    def extract_texture_features(self, palm_roi):
        if palm_roi is None or palm_roi.size == 0:
            return {}
        
        gray = cv2.cvtColor(palm_roi, cv2.COLOR_BGR2GRAY) if len(palm_roi.shape) == 3 else palm_roi
        
        lbp_features = self._compute_lbp(gray)
        gabor_features = self._compute_gabor_features(gray)
        
        return {
            'lbp': lbp_features,
            'gabor': gabor_features
        }
    
    def _compute_lbp(self, gray_image):
        radius = 1
        n_points = 8 * radius
        
        height, width = gray_image.shape
        lbp = np.zeros((height, width), dtype=np.uint8)
        
        for i in range(radius, height - radius):
            for j in range(radius, width - radius):
                center = gray_image[i, j]
                binary_string = ''
                
                for k in range(n_points):
                    angle = 2 * np.pi * k / n_points
                    x = int(i + radius * np.cos(angle))
                    y = int(j + radius * np.sin(angle))
                    
                    if 0 <= x < height and 0 <= y < width:
                        binary_string += '1' if gray_image[x, y] >= center else '0'
                
                lbp[i, j] = int(binary_string, 2) if binary_string else 0
        
        hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
        hist = hist.astype(float)
        hist /= (hist.sum() + 1e-6)
        
        return hist.tolist()
    
    def _compute_gabor_features(self, gray_image):
        kernels = []
        for theta in range(4):
            theta_rad = theta / 4. * np.pi
            for sigma in [1, 3]:
                for frequency in [0.05, 0.25]:
                    kernel = cv2.getGaborKernel((21, 21), sigma, theta_rad, 10/frequency, 0.5, 0, ktype=cv2.CV_32F)
                    kernels.append(kernel)
        
        features = []
        for kernel in kernels:
            filtered = cv2.filter2D(gray_image, cv2.CV_8UC3, kernel)
            features.append(filtered.mean())
            features.append(filtered.var())
        
        return features
    
    def extract_keypoint_features(self, palm_roi):
        if palm_roi is None or palm_roi.size == 0:
            return {}
        
        gray = cv2.cvtColor(palm_roi, cv2.COLOR_BGR2GRAY) if len(palm_roi.shape) == 3 else palm_roi
        
        sift_kp, sift_desc = self.sift.detectAndCompute(gray, None)
        orb_kp, orb_desc = self.orb.detectAndCompute(gray, None)
        
        return {
            'sift_keypoints_count': len(sift_kp),
            'sift_descriptors': sift_desc.tolist() if sift_desc is not None else [],
            'orb_keypoints_count': len(orb_kp),
            'orb_descriptors': orb_desc.tolist() if orb_desc is not None else []
        }
    
    def extract_palm_lines(self, palm_roi):
        if palm_roi is None or palm_roi.size == 0:
            return {}
        
        gray = cv2.cvtColor(palm_roi, cv2.COLOR_BGR2GRAY) if len(palm_roi.shape) == 3 else palm_roi
        
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=30, maxLineGap=10)
        
        line_features = {
            'line_count': 0,
            'avg_line_length': 0,
            'line_orientations': []
        }
        
        if lines is not None:
            line_features['line_count'] = len(lines)
            
            lengths = []
            orientations = []
            
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                lengths.append(length)
                
                angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                orientations.append(angle)
            
            line_features['avg_line_length'] = np.mean(lengths) if lengths else 0
            line_features['line_orientations'] = orientations
        
        return line_features
    
    def extract_statistical_features(self, palm_roi):
        if palm_roi is None or palm_roi.size == 0:
            return {}
        
        gray = cv2.cvtColor(palm_roi, cv2.COLOR_BGR2GRAY) if len(palm_roi.shape) == 3 else palm_roi
        
        return {
            'mean': float(np.mean(gray)),
            'std': float(np.std(gray)),
            'min': float(np.min(gray)),
            'max': float(np.max(gray)),
            'median': float(np.median(gray)),
            'variance': float(np.var(gray))
        }
    
    def create_feature_vector(self, features):
        vector = []
        
        if 'geometric' in features:
            geom = features['geometric']
            if 'finger_lengths' in geom:
                vector.extend(geom['finger_lengths'].values())
            if 'palm_dimensions' in geom:
                vector.extend([geom['palm_dimensions']['length'], geom['palm_dimensions']['width']])
        
        if 'statistical' in features:
            stats = features['statistical']
            vector.extend([stats['mean'], stats['std'], stats['variance']])
        
        if 'texture' in features and 'gabor' in features['texture']:
            vector.extend(features['texture']['gabor'][:10])
        
        return np.array(vector)

palm_feature_extractor = PalmFeatureExtractor()
