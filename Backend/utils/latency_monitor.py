import time
from collections import deque
from functools import wraps

class LatencyMonitor:
    def __init__(self, max_samples=100):
        self.latencies = deque(maxlen=max_samples)
        self.operation_latencies = {}
    
    def record(self, operation_name, latency_ms):
        self.latencies.append(latency_ms)
        if operation_name not in self.operation_latencies:
            self.operation_latencies[operation_name] = deque(maxlen=100)
        self.operation_latencies[operation_name].append(latency_ms)
    
    def get_average(self):
        if not self.latencies:
            return 0
        return sum(self.latencies) / len(self.latencies)
    
    def get_operation_average(self, operation_name):
        if operation_name not in self.operation_latencies:
            return 0
        latencies = self.operation_latencies[operation_name]
        if not latencies:
            return 0
        return sum(latencies) / len(latencies)
    
    def get_stats(self):
        if not self.latencies:
            return {'avg': 0, 'min': 0, 'max': 0, 'count': 0}
        return {
            'avg': self.get_average(),
            'min': min(self.latencies),
            'max': max(self.latencies),
            'count': len(self.latencies)
        }

monitor = LatencyMonitor()

def measure_latency(operation_name):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            monitor.record(operation_name, latency_ms)
            return result
        return wrapper
    return decorator
