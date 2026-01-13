import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Scan, Check } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';
import './BiometricSetup.css';

const BiometricSetup = () => {
    const [step, setStep] = useState(0);
    const [embeddings, setEmbeddings] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [complete, setComplete] = useState(false);

    const { user, token, updateUser } = useAuth();
    const navigate = useNavigate();

    const {
        videoRef,
        canvasRef,
        status,
        startCamera,
        stopCamera,
        captureEmbedding
    } = useHandDetection();

    const TOTAL_SCANS = 3;

    const handleStartScan = async () => {
        setIsScanning(true);
        await startCamera();
    };

    const handleCaptureScan = async () => {
        const embedding = await captureEmbedding();

        if (embedding) {
            const newEmbeddings = [...embeddings, embedding];
            setEmbeddings(newEmbeddings);
            setStep(step + 1);

            if (step + 1 >= TOTAL_SCANS) {
                await registerBiometric(newEmbeddings);
            } else {
                stopCamera();
                setTimeout(() => {
                    startCamera();
                }, 1500);
            }
        }
    };

    const registerBiometric = async (allEmbeddings) => {
        try {
            const response = await fetch('/api/biometric/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ embeddings: allEmbeddings })
            });

            if (response.ok) {
                updateUser({ hasBiometrics: true });
                setComplete(true);
                stopCamera();
            } else {
                alert('Failed to register biometric data');
            }
        } catch (error) {
            console.error('Error registering biometric:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleComplete = () => {
        navigate('/dashboard');
    };

    return (
        <div className="biometric-page">
            <div className="biometric-container">
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <motion.div
                    className="biometric-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {!complete ? (
                        <>
                            <h1 className="biometric-title">
                                {user?.hasBiometrics ? 'Update' : 'Setup'} Biometric
                            </h1>
                            <p className="biometric-subtitle">
                                We'll scan your palm 5 times from different angles for accuracy
                            </p>

                            <div className="progress-steps">
                                {[...Array(TOTAL_SCANS)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`progress-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
                                    >
                                        {i < step ? <Check size={16} /> : i + 1}
                                    </div>
                                ))}
                            </div>

                            <div className={`scan-area ${isScanning ? 'scanning' : ''}`}>
                                <video ref={videoRef} className="video-feed" autoPlay playsInline />
                                <canvas ref={canvasRef} className="canvas-overlay" />
                                <div className="scan-ring">
                                    <div className="cosmic-ring" />
                                </div>
                                {!isScanning && (
                                    <div className="scan-placeholder">
                                        <Scan size={64} className="placeholder-icon" />
                                        <p>Click below to start scanning</p>
                                    </div>
                                )}
                            </div>

                            <p className="scan-status">{status}</p>

                            {!isScanning ? (
                                <button onClick={handleStartScan} className="btn-primary">
                                    <Scan size={20} />
                                    Start Scan {step + 1}/{TOTAL_SCANS}
                                </button>
                            ) : (
                                <button onClick={handleCaptureScan} className="btn-primary">
                                    <Check size={20} />
                                    Capture Scan {step + 1}/{TOTAL_SCANS}
                                </button>
                            )}

                            <div className="scan-tips">
                                <h3>Tips for best results:</h3>
                                <ul>
                                    <li>Ensure good lighting</li>
                                    <li>Hold your palm steady</li>
                                    <li>Keep fingers spread slightly</li>
                                    <li>Try different angles for each scan</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            className="success-screen"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="success-icon">
                                <Check size={64} />
                            </div>
                            <h2 className="success-title">Biometric Setup Complete!</h2>
                            <p className="success-message">
                                Your palm has been successfully registered. You can now make payments with just a scan.
                            </p>
                            <button onClick={handleComplete} className="btn-primary">
                                Go to Dashboard
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default BiometricSetup;
