import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Scan, Check, X, Sparkles } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';
import './Payment.css';

const Payment = () => {
    const [amount, setAmount] = useState(100);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPinVerify, setShowPinVerify] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);
    const [confetti, setConfetti] = useState([]);
    const [paymentAttempt, setPaymentAttempt] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const pinRefs = [useRef(), useRef(), useRef(), useRef()];

    // Generate confetti particles
    const generateConfetti = () => {
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 1
            });
        }
        setConfetti(particles);
    };

    // Play alarm buzzer sound for access denied
    const playAlarmSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create oscillator for strong beep
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Harsh alarm frequency pattern
            oscillator.frequency.value = 800; // Start frequency
            oscillator.type = 'square'; // Square wave for harsh sound
            
            // Volume control
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            
            // Beep pattern: 3 sharp beeps
            const beepDuration = 0.15;
            const pauseDuration = 0.1;
            
            for (let i = 0; i < 3; i++) {
                const startTime = audioContext.currentTime + (i * (beepDuration + pauseDuration));
                
                // Frequency sweep for alarm effect
                oscillator.frequency.setValueAtTime(800, startTime);
                oscillator.frequency.linearRampToValueAtTime(1000, startTime + beepDuration * 0.5);
                oscillator.frequency.linearRampToValueAtTime(800, startTime + beepDuration);
                
                // Volume envelope
                gainNode.gain.setValueAtTime(0.5, startTime);
                gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);
            }
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + (3 * (beepDuration + pauseDuration)));
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    };

    const {
        videoRef,
        canvasRef,
        status,
        startCamera,
        stopCamera,
        processHandScan
    } = useHandDetection();

    const handleStartScan = async () => {
        setScanning(true);
        setResult(null);
        setIsProcessing(true);
        await startCamera();

        const scanResult = await processHandScan();

        // Simulate 1 second processing delay after scan
        setTimeout(() => {
            setIsProcessing(false);
            setScanning(false);
            
            // Increment attempt counter
            const newAttempt = paymentAttempt + 1;
            setPaymentAttempt(newAttempt);
            
            // Demo logic: Pass on EVEN attempts, fail on ODD attempts
            const isSuccessful = newAttempt % 2 === 0;
            
            if (isSuccessful) {
                // Success on even attempts
                if (scanResult.matched) {
                    setMatchedUser(scanResult.user);
                    if (amount > 500) {
                        setShowPinVerify(true);
                    } else {
                        processPayment(scanResult.user);
                    }
                } else {
                    // Use real logged-in user with correct ObjectId
                    const demoUser = {
                        id: user._id,
                        name: user.name,
                        pin: user.pin || '1234'
                    };
                    setMatchedUser(demoUser);
                    if (amount > 500) {
                        setShowPinVerify(true);
                    } else {
                        processPayment(demoUser);
                    }
                }
            } else {
                // Failure on odd attempts
                playAlarmSound(); // Play alarm buzzer
                setResult({
                    success: false,
                    message: '❌ Wrong Biometrics - Access Denied',
                    isDemoFailure: true
                });
                stopCamera();
            }
        }, 1000); // 1 second delay
    };

    const processPayment = async (userToCharge) => {
        try {
            // Demo mode: Simulate payment without backend call
            // In production, replace with actual backend call
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate confetti on successful payment
            generateConfetti();
            
            // Calculate new balance (demo)
            const newBalance = (userToCharge.balance || 5000) - amount;
            
            setResult({
                success: true,
                message: 'Payment Successful!',
                user: userToCharge,
                amount,
                newBalance: newBalance
            });

            // Update user balance in context
            if (userToCharge.id === user._id) {
                updateUser({ balance: newBalance });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Payment failed'
            });
        } finally {
            setScanning(false);
            setShowPinVerify(false);
            stopCamera();
        }
    };

    const handlePinChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value && index < 3) {
            pinRefs[index + 1].current.focus();
        }
    };

    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current.focus();
        }
    };

    const verifyPIN = () => {
        const enteredPin = pin.join('');
        if (enteredPin === matchedUser.pin) {
            processPayment(matchedUser);
        } else {
            alert('Incorrect PIN');
            setPin(['', '', '', '']);
            pinRefs[0].current.focus();
        }
    };

    const closeResult = () => {
        setResult(null);
        setPin(['', '', '', '']);
        setConfetti([]);
    };

    return (
        <div className="payment-page">
            {/* Confetti particles */}
            {confetti.map(particle => (
                <div
                    key={particle.id}
                    className="confetti"
                    style={{
                        left: `${particle.left}%`,
                        animation: `confetti-fall ${particle.duration}s linear`,
                        animationDelay: `${particle.delay}s`
                    }}
                />
            ))}
            <div className="payment-container">
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <motion.div
                    className="payment-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="payment-title">Make Payment</h1>

                    <div className="amount-selector">
                        <button
                            className="amt-btn"
                            onClick={() => setAmount(Math.max(50, amount - 50))}
                        >
                            −
                        </button>
                        <div className="amount-display">
                            <span className="amount-value">{amount}</span>
                            <span className="amount-currency">som</span>
                        </div>
                        <button
                            className="amt-btn"
                            onClick={() => setAmount(amount + 50)}
                        >
                            +
                        </button>
                    </div>

                    <div className={`scan-area ${scanning ? 'scanning' : ''}`}>
                        <video ref={videoRef} className="video-feed" autoPlay playsInline />
                        <canvas ref={canvasRef} className="canvas-overlay" />
                        <div className="scan-ring">
                            <div className="cosmic-ring" />
                        </div>
                    </div>

                    <p className="scan-status">{status}</p>

                    {!scanning && !result && (
                        <button onClick={handleStartScan} className="btn-primary">
                            <Scan size={20} />
                            Scan Palm to Pay
                        </button>
                    )}

                    {(scanning || isProcessing) && (
                        <>
                            <button onClick={() => { setScanning(false); stopCamera(); }} className="btn-secondary">
                                Cancel Scan
                            </button>
                            {isProcessing && (
                                <div className="processing-indicator">
                                    <div className="spinner"></div>
                                    <p>Processing biometric data...</p>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>

                {showPinVerify && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="modal-content glass-card"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                        >
                            <h2 className="modal-title">PIN Verification Required</h2>
                            <p className="modal-subtitle">Amount exceeds 500 som</p>

                            <div className="pin-input-group">
                                {pin.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={pinRefs[index]}
                                        type="password"
                                        className="pin-digit"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                                    />
                                ))}
                            </div>

                            <button onClick={verifyPIN} className="btn-primary mt-3">
                                Verify & Pay
                            </button>
                            <button
                                onClick={() => { setShowPinVerify(false); setScanning(false); stopCamera(); }}
                                className="btn-secondary mt-2"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className={`modal-content glass-card ${result.success ? 'success-modal' : 'error-modal'}`}
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                        >
                            <motion.div
                                className={`result-icon ${result.success ? 'success' : 'error'}`}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                {result.success ? <Check size={48} /> : <X size={48} />}
                            </motion.div>

                            <motion.h2
                                className={`result-title ${result.success ? 'text-success' : 'text-error'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {result.success ? '✅ Payment Successful! ✅' : result.message}
                            </motion.h2>

                            {result.success && (
                                <>
                                    <motion.div
                                        className="success-subtitle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                    >
                                        <Sparkles size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                        Trade Purchased Successfully
                                        <Sparkles size={20} style={{ display: 'inline', marginLeft: '0.5rem' }} />
                                    </motion.div>

                                    <motion.p
                                        className="result-user"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        Paid to: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{result.user.name}</span>
                                    </motion.p>

                                    <motion.div
                                        className="result-amount-box"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div className="result-amount">{result.amount} som</div>
                                        <div className="result-balance">New Balance: {result.newBalance} som</div>
                                    </motion.div>

                                    <motion.p
                                        className="result-message"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        ✨ Secured with biometric authentication ✨
                                    </motion.p>
                                </>
                            )}

                            {result.isDemoFailure && (
                                <motion.p
                                    className="result-message error-message"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    🔐 Wrong User Biometrics: Palm Blocked
                                </motion.p>
                            )}

                            <motion.button
                                onClick={closeResult}
                                className={`btn-primary mt-3 ${result.success ? '' : 'btn-error'}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {result.success ? '🎉 Done' : 'Try Again'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Payment;