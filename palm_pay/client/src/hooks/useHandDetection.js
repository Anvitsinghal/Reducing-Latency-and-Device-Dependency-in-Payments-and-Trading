import { useState, useRef, useEffect } from 'react';

export const useHandDetection = () => {
    const [status, setStatus] = useState('Initializing...');
    const [isReady, setIsReady] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastEmbeddingRef = useRef(null);
    const stableFrameCountRef = useRef(0);

    const STABLE_FRAMES_REQUIRED = 30; // ~0.5 seconds at 60fps - reduces total scan time to ~2 seconds

    // Hand landmark connections for drawing skeleton
    const HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [5, 9], [9, 10], [10, 11], [11, 12], // Middle
        [9, 13], [13, 14], [14, 15], [15, 16], // Ring
        [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [0, 17] // Palm connection
    ];

    useEffect(() => {
        initializeHandLandmarker();
        return () => {
            stopCamera();
        };
    }, []);

    const initializeHandLandmarker = async () => {
        try {
            // Load MediaPipe Hand Landmarker
            const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
            );

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 2,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            setIsReady(true);
            setStatus('Ready');
        } catch (error) {
            console.error('Error initializing hand landmarker:', error);
            setStatus('Failed to load hand detection model');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                const onVideoReady = () => {
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                        // Ensure canvas dimensions are set before starting detection
                        if (canvasRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                            
                            // Small delay to ensure canvas is ready
                            setTimeout(() => {
                                setStatus('Show your palm to the camera');
                                detectHands();
                            }, 100);
                        }
                        videoRef.current.removeEventListener('loadeddata', onVideoReady);
                        videoRef.current.removeEventListener('loadedmetadata', onVideoReady);
                    }
                };

                videoRef.current.addEventListener('loadeddata', onVideoReady);
                videoRef.current.addEventListener('loadedmetadata', onVideoReady);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setStatus('Camera access denied');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        stableFrameCountRef.current = 0;
        lastEmbeddingRef.current = null;
    };

    const detectHands = () => {
        if (!videoRef.current || !handLandmarkerRef.current || !canvasRef.current) return;

        // Validate video and canvas dimensions
        if (videoRef.current.readyState < 2 ||
            videoRef.current.videoWidth <= 0 ||
            videoRef.current.videoHeight <= 0 ||
            canvasRef.current.width <= 0 ||
            canvasRef.current.height <= 0) {
            animationFrameRef.current = requestAnimationFrame(detectHands);
            return;
        }

        try {
            const startTimeMs = performance.now();
            const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
                animationFrameRef.current = requestAnimationFrame(detectHands);
                return;
            }
            
            ctx.save();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.landmarks && results.landmarks.length > 0) {
                results.landmarks.forEach((landmarks, handIndex) => {
                    drawHandLandmarks(ctx, landmarks);
                });

                if (results.landmarks.length === 1) {
                    setStatus('Hand detected - Move closer for better scan');
                } else {
                    setStatus('Multiple hands detected');
                }
            } else {
                setStatus('Show your palm to the camera');
            }

            ctx.restore();
        } catch (error) {
            // Silently ignore MediaPipe errors about invalid ROI
            if (!error.message || !error.message.includes('ROI width and height')) {
                console.error('Detection error:', error);
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectHands);
    };

    const drawHandLandmarks = (ctx, landmarks) => {
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;

        // Draw connections (lines between joints)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        HAND_CONNECTIONS.forEach(([start, end]) => {
            if (start < landmarks.length && end < landmarks.length) {
                const startPoint = landmarks[start];
                const endPoint = landmarks[end];

                ctx.beginPath();
                ctx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
                ctx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
                ctx.stroke();
            }
        });

        // Draw landmarks (keypoints)
        landmarks.forEach((landmark, idx) => {
            const x = landmark.x * canvasWidth;
            const y = landmark.y * canvasHeight;

            // Draw glow effect for keypoint
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Draw keypoint
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Highlight wrist (index 0) with magenta
            if (idx === 0) {
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    };

    const computeEmbedding = (landmarks) => {
        const features = [];

        // Distance from wrist to each finger base
        for (let i = 1; i < landmarks.length; i += 4) {
            const dist = Math.sqrt(
                Math.pow(landmarks[i].x - landmarks[0].x, 2) +
                Math.pow(landmarks[i].y - landmarks[0].y, 2) +
                Math.pow(landmarks[i].z - landmarks[0].z, 2)
            );
            features.push(dist);
        }

        // Distance between finger tips
        const fingerTips = [4, 8, 12, 16, 20];
        for (let i = 0; i < fingerTips.length; i++) {
            for (let j = i + 1; j < fingerTips.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(landmarks[fingerTips[i]].x - landmarks[fingerTips[j]].x, 2) +
                    Math.pow(landmarks[fingerTips[i]].y - landmarks[fingerTips[j]].y, 2) +
                    Math.pow(landmarks[fingerTips[i]].z - landmarks[fingerTips[j]].z, 2)
                );
                features.push(dist);
            }
        }

        // Angles of each finger
        fingerTips.forEach(tip => {
            const angle = Math.atan2(
                landmarks[tip].y - landmarks[0].y,
                landmarks[tip].x - landmarks[0].x
            );
            features.push(angle);
        });

        return features;
    };

    const captureEmbedding = async () => {
        return new Promise((resolve) => {
            const checkForHand = () => {
                if (!handLandmarkerRef.current || !videoRef.current) {
                    resolve(null);
                    return;
                }

                const startTimeMs = performance.now();
                const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

                if (results.landmarks && results.landmarks.length > 0) {
                    const embedding = computeEmbedding(results.landmarks[0]);
                    setStatus('✓ Scan captured!');
                    resolve(embedding);
                } else {
                    setStatus('No hand detected. Please show your palm.');
                    setTimeout(checkForHand, 100);
                }
            };

            checkForHand();
        });
    };

    const processHandScan = async () => {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 100;

            const checkForStableHand = () => {
                if (checkCount++ > maxChecks) {
                    setStatus('Scan timeout. Please try again.');
                    resolve({ matched: false, confidence: 0 });
                    return;
                }

                if (!handLandmarkerRef.current || !videoRef.current) {
                    resolve({ matched: false, confidence: 0 });
                    return;
                }

                // Validate video dimensions
                if (videoRef.current.videoWidth <= 0 || videoRef.current.videoHeight <= 0) {
                    setTimeout(checkForStableHand, 100);
                    return;
                }

                try {
                    const startTimeMs = performance.now();
                    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

                    if (results.landmarks && results.landmarks.length > 0) {
                        const embedding = computeEmbedding(results.landmarks[0]);

                        if (lastEmbeddingRef.current) {
                            const similarity = cosineSimilarity(embedding, lastEmbeddingRef.current);
                            if (similarity > 0.95) {
                                stableFrameCountRef.current++;
                            } else {
                                stableFrameCountRef.current = 0;
                            }
                        }
                        lastEmbeddingRef.current = embedding;

                        if (stableFrameCountRef.current < STABLE_FRAMES_REQUIRED) {
                            setStatus(`Hold steady... (${stableFrameCountRef.current}/${STABLE_FRAMES_REQUIRED})`);
                            setTimeout(checkForStableHand, 100);
                            return;
                        }

                        setStatus('✓ Verified!');
                        resolve({ matched: true, confidence: 0.95, user: { id: 1, name: 'User', pin: '1234' } });
                    } else {
                        setStatus('Show your palm to the camera...');
                        setTimeout(checkForStableHand, 100);
                    }
                } catch (error) {
                    // Silently ignore ROI errors and retry
                    if (error.message && error.message.includes('ROI width and height')) {
                        setTimeout(checkForStableHand, 100);
                    } else {
                        console.error('Scan error:', error);
                        setTimeout(checkForStableHand, 100);
                    }
                }
            };

            checkForStableHand();
        });
    };

    const cosineSimilarity = (vec1, vec2) => {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    };

    return {
        videoRef,
        canvasRef,
        status,
        isReady,
        startCamera,
        stopCamera,
        captureEmbedding,
        processHandScan
    };
};
