import { useState, useRef, useEffect } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

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

    const STABLE_FRAMES_REQUIRED = 15;
    const MIN_CONFIDENCE = 0.75;

    useEffect(() => {
        initializeHandLandmarker();
        return () => {
            stopCamera();
        };
    }, []);

    const initializeHandLandmarker = async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
            );

            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 1,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            setIsReady(true);
            setStatus('Ready');
        } catch (error) {
            console.error('Error initializing hand landmarker:', error);
            setStatus('Failed to initialize. Please refresh.');
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
                    // Wait for video to be fully ready
                    if (videoRef.current.readyState >= 2) {
                        if (canvasRef.current && videoRef.current.videoWidth > 0) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;

                            // Small delay to ensure everything is ready
                            setTimeout(() => {
                                detectHands();
                                setStatus('Show your palm to the camera');
                            }, 100);
                        }
                        videoRef.current.removeEventListener('loadeddata', onVideoReady);
                    }
                };

                videoRef.current.addEventListener('loadeddata', onVideoReady);

                // Also try with loadedmetadata as backup
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

        // Ensure video is ready and has valid dimensions
        if (videoRef.current.readyState < 2 ||
            videoRef.current.videoWidth === 0 ||
            videoRef.current.videoHeight === 0) {
            animationFrameRef.current = requestAnimationFrame(detectHands);
            return;
        }

        try {
            const startTimeMs = performance.now();
            const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            const ctx = canvasRef.current.getContext('2d');
            ctx.save();
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                drawHandLandmarks(ctx, landmarks);
            }

            ctx.restore();
        } catch (error) {
            console.error('Detection error:', error);
        }

        animationFrameRef.current = requestAnimationFrame(detectHands);
    };

    const drawHandLandmarks = (ctx, landmarks) => {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];

        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvasRef.current.width, startPoint.y * canvasRef.current.height);
            ctx.lineTo(endPoint.x * canvasRef.current.width, endPoint.y * canvasRef.current.height);
            ctx.stroke();
        });

        landmarks.forEach((landmark, index) => {
            const x = landmark.x * canvasRef.current.width;
            const y = landmark.y * canvasRef.current.height;

            ctx.beginPath();
            ctx.arc(x, y, index === 0 ? 8 : 4, 0, 2 * Math.PI);
            ctx.fillStyle = index === 0 ? '#00ffc8' : '#00d4aa';
            ctx.fill();
        });
    };

    const computeEmbedding = (landmarks) => {
        const features = [];

        const palmWidth = distance(landmarks[0], landmarks[5]);
        const palmHeight = distance(landmarks[0], landmarks[9]);
        features.push(palmWidth, palmHeight);

        for (let i = 0; i < 5; i++) {
            const base = i === 0 ? 1 : (i * 4 + 1);
            const tip = i === 0 ? 4 : (i * 4 + 4);
            features.push(distance(landmarks[base], landmarks[tip]));
        }

        for (let i = 0; i < 5; i++) {
            const base = i === 0 ? 1 : (i * 4 + 1);
            const mid = i === 0 ? 2 : (i * 4 + 2);
            const tip = i === 0 ? 4 : (i * 4 + 4);
            const ratio = distance(landmarks[base], landmarks[mid]) / distance(landmarks[mid], landmarks[tip]);
            features.push(ratio);
        }

        const fingerTips = [4, 8, 12, 16, 20];
        for (let i = 0; i < fingerTips.length; i++) {
            for (let j = i + 1; j < fingerTips.length; j++) {
                features.push(distance(landmarks[fingerTips[i]], landmarks[fingerTips[j]]));
            }
        }

        for (let i = 1; i <= 5; i++) {
            const base = i === 1 ? 1 : (i - 1) * 4 + 1;
            const angle = Math.atan2(
                landmarks[base].y - landmarks[0].y,
                landmarks[base].x - landmarks[0].x
            );
            features.push(angle);
        }

        fingerTips.forEach(tip => {
            features.push(distance(landmarks[0], landmarks[tip]));
        });

        return features;
    };

    const distance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
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
                    setStatus('Scan captured!');
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

            const checkForStableHand = async () => {
                if (checkCount++ > maxChecks) {
                    setStatus('Scan timeout. Please try again.');
                    resolve({ matched: false, confidence: 0 });
                    return;
                }

                if (!handLandmarkerRef.current || !videoRef.current) {
                    resolve({ matched: false, confidence: 0 });
                    return;
                }

                const startTimeMs = performance.now();
                const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

                if (results.landmarks && results.landmarks.length > 0) {
                    const embedding = computeEmbedding(results.landmarks[0]);

                    if (lastEmbeddingRef.current) {
                        const stability = cosineSimilarity(embedding, lastEmbeddingRef.current);
                        if (stability > 0.95) {
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

                    setStatus('Verifying...');
                    try {
                        const response = await fetch('/api/biometric/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ embedding })
                        });

                        const data = await response.json();
                        resolve(data);
                    } catch (error) {
                        console.error('Verification error:', error);
                        resolve({ matched: false, confidence: 0 });
                    }
                } else {
                    setStatus('Show your palm to the camera...');
                    setTimeout(checkForStableHand, 100);
                }
            };

            checkForStableHand();
        });
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
