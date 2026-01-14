import numpy as np
from collections import deque

class SmoothingService:
    def __init__(self, window_size=5):
        self.window_size = window_size
        self.point_buffer = deque(maxlen=window_size)
    
    def smooth_trajectory(self, points):
        if len(points) < 2:
            return points
        
        smoothed = []
        for i, point in enumerate(points):
            if i == 0:
                smoothed.append(point)
            elif i == len(points) - 1:
                smoothed.append(point)
            else:
                smoothed_point = self._apply_moving_average(points, i)
                smoothed.append(smoothed_point)
        
        return smoothed
    
    def _apply_moving_average(self, points, index):
        window_start = max(0, index - self.window_size // 2)
        window_end = min(len(points), index + self.window_size // 2 + 1)
        
        window_points = points[window_start:window_end]
        
        avg_x = np.mean([p[0] for p in window_points])
        avg_y = np.mean([p[1] for p in window_points])
        
        return [avg_x, avg_y]
    
    def kalman_filter(self, points):
        if len(points) < 2:
            return points
        
        filtered = []
        estimate = points[0]
        estimate_error = 1.0
        measurement_error = 0.5
        process_noise = 0.1
        
        for point in points:
            kalman_gain = estimate_error / (estimate_error + measurement_error)
            
            estimate = [
                estimate[0] + kalman_gain * (point[0] - estimate[0]),
                estimate[1] + kalman_gain * (point[1] - estimate[1])
            ]
            
            estimate_error = (1 - kalman_gain) * estimate_error + process_noise
            
            filtered.append(estimate[:])
        
        return filtered
    
    def exponential_smoothing(self, points, alpha=0.3):
        if len(points) < 2:
            return points
        
        smoothed = [points[0]]
        
        for i in range(1, len(points)):
            smoothed_point = [
                alpha * points[i][0] + (1 - alpha) * smoothed[-1][0],
                alpha * points[i][1] + (1 - alpha) * smoothed[-1][1]
            ]
            smoothed.append(smoothed_point)
        
        return smoothed
    
    def remove_tremor(self, points, threshold=2.0):
        if len(points) < 3:
            return points
        
        filtered = [points[0]]
        
        for i in range(1, len(points) - 1):
            prev_point = filtered[-1]
            curr_point = points[i]
            next_point = points[i + 1]
            
            dist_to_prev = np.linalg.norm(np.array(curr_point) - np.array(prev_point))
            dist_to_next = np.linalg.norm(np.array(next_point) - np.array(curr_point))
            
            if dist_to_prev < threshold and dist_to_next < threshold:
                avg_point = [
                    (prev_point[0] + curr_point[0] + next_point[0]) / 3,
                    (prev_point[1] + curr_point[1] + next_point[1]) / 3
                ]
                filtered.append(avg_point)
            else:
                filtered.append(curr_point)
        
        filtered.append(points[-1])
        
        return filtered
    
    def adaptive_smooth(self, points, velocity_threshold=10.0):
        if len(points) < 2:
            return points
        
        smoothed = [points[0]]
        
        for i in range(1, len(points)):
            velocity = np.linalg.norm(
                np.array(points[i]) - np.array(points[i-1])
            )
            
            if velocity > velocity_threshold:
                alpha = 0.7
            else:
                alpha = 0.3
            
            smoothed_point = [
                alpha * points[i][0] + (1 - alpha) * smoothed[-1][0],
                alpha * points[i][1] + (1 - alpha) * smoothed[-1][1]
            ]
            smoothed.append(smoothed_point)
        
        return smoothed

smoothing_service = SmoothingService()
