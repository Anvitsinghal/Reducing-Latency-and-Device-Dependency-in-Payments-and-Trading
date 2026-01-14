import React, { useEffect, useRef, useState } from 'react';

function GestureOverlay({ onGestureDetected, currentGesture }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [gestureTrail, setGestureTrail] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gestureTrail.length > 0) {
      drawGestureTrail(ctx, gestureTrail);
    }

    if (currentGesture) {
      drawGestureIndicator(ctx, currentGesture);
    }
  }, [gestureTrail, currentGesture]);

  const drawGestureTrail = (ctx, trail) => {
    if (trail.length < 2) return;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);

    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawGestureIndicator = (ctx, gesture) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = 50;

    ctx.fillStyle = gesture.confidence >= 0.75 ? '#00ff88' : '#ff6b6b';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(gesture.gesture_type.toUpperCase(), centerX, centerY);

    ctx.font = '16px Inter';
    ctx.fillText(`Confidence: ${(gesture.confidence * 100).toFixed(0)}%`, centerX, centerY + 30);
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: Date.now()
    };
    setPoints([point]);
    setGestureTrail([point]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: Date.now()
    };

    setPoints(prev => [...prev, point]);
    setGestureTrail(prev => [...prev, point]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (points.length > 2) {
      processGesture(points);
    }

    setTimeout(() => {
      setGestureTrail([]);
      setPoints([]);
    }, 1000);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now()
    };
    setIsDrawing(true);
    setPoints([point]);
    setGestureTrail([point]);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now()
    };

    setPoints(prev => [...prev, point]);
    setGestureTrail(prev => [...prev, point]);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const processGesture = async (gesturePoints) => {
    try {
      const response = await fetch('http://localhost:5000/api/gesture/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gesture_data: {
            points: gesturePoints.map(p => [p.x, p.y])
          }
        })
      });

      const data = await response.json();
      if (data.success && onGestureDetected) {
        onGestureDetected(data);
      }
    } catch (error) {
      console.error('Gesture processing failed:', error);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="gesture-overlay"
      width={1280}
      height={720}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

export default GestureOverlay;
