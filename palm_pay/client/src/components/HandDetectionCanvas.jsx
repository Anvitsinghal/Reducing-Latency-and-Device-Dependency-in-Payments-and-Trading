import { useState, useEffect, useRef } from 'react';
import './HandDetectionCanvas.css';

const HandDetectionCanvas = ({ videoRef, canvasRef, isActive }) => {
    const [handKeypoints, setHandKeypoints] = useState([]);
    const canvasContextRef = useRef(null);

    // Hand landmark connections (MediaPipe format)
    const HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [5, 9], [9, 10], [10, 11], [11, 12], // Middle
        [9, 13], [13, 14], [14, 15], [15, 16], // Ring
        [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [0, 17] // Palm
    ];

    useEffect(() => {
        if (canvasRef?.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasContextRef.current = ctx;
        }
    }, [canvasRef]);

    // Simulate hand keypoints (simulating MediaPipe hand detection)
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            if (videoRef?.current && canvasRef?.current) {
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                if (videoWidth > 0 && videoHeight > 0) {
                    // Generate realistic hand keypoints centered on screen
                    const centerX = videoWidth * 0.5;
                    const centerY = videoHeight * 0.5;
                    const handScale = Math.min(videoWidth, videoHeight) * 0.25;

                    // Base hand skeleton coordinates (normalized)
                    const baseKeypoints = [
                        [0, 0], // Wrist
                        [0, -0.3], [0, -0.5], [0, -0.7], [0, -0.9], // Thumb
                        [0.2, -0.35], [0.25, -0.55], [0.28, -0.75], [0.3, -0.95], // Index
                        [0.35, -0.35], [0.45, -0.6], [0.5, -0.8], [0.52, -1.0], // Middle
                        [0.25, -0.25], [0.42, -0.45], [0.5, -0.65], [0.53, -0.85], // Ring
                        [0.1, -0.2], [0.35, -0.3], [0.45, -0.5], [0.5, -0.7] // Pinky
                    ];

                    // Add slight animation to make it look alive
                    const time = Date.now() * 0.001;
                    const animatedKeypoints = baseKeypoints.map((point, idx) => {
                        const angle = (time + idx) * 0.3;
                        const wobble = Math.sin(angle) * 0.02;
                        return [
                            (point[0] + wobble) * handScale + centerX,
                            (point[1] + wobble * 0.7) * handScale + centerY
                        ];
                    });

                    setHandKeypoints(animatedKeypoints);
                    drawHand(animatedKeypoints);
                }
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isActive, videoRef, canvasRef]);

    const drawHand = (keypoints) => {
        if (!canvasContextRef.current || !canvasRef?.current) return;

        const ctx = canvasContextRef.current;
        const canvas = canvasRef.current;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (keypoints.length === 0) return;

        // Draw connections (lines between joints)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        HAND_CONNECTIONS.forEach(([start, end]) => {
            if (start < keypoints.length && end < keypoints.length) {
                ctx.beginPath();
                ctx.moveTo(keypoints[start][0], keypoints[start][1]);
                ctx.lineTo(keypoints[end][0], keypoints[end][1]);
                ctx.stroke();
            }
        });

        // Draw landmarks (points)
        keypoints.forEach((point, idx) => {
            // Draw glow effect
            const gradient = ctx.createRadialGradient(point[0], point[1], 0, point[0], point[1], 12);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point[0], point[1], 12, 0, Math.PI * 2);
            ctx.fill();

            // Draw point
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(point[0], point[1], 6, 0, Math.PI * 2);
            ctx.fill();

            // Highlight wrist (index 0)
            if (idx === 0) {
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(point[0], point[1], 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    };

    return null; // Rendering is handled via canvas ref
};

export default HandDetectionCanvas;
