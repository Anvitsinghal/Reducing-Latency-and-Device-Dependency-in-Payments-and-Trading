import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Scan, Check, X } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';
import './Payment.css';

const Payment = () => {
    const [amount, setAmount] = useState(100);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPinVerify, setShowPinVerify] = useState(false);
    const [matchedUser, setMatchedUser] = useState(null);

    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const pinRefs = [useRef(), useRef(), useRef(), useRef()];

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
        await startCamera();

        const scanResult = await processHandScan();

        if (scanResult.matched) {
            setMatchedUser(scanResult.user);

            if (amount > 500) {
                setShowPinVerify(true);
            } else {
                processPayment(scanResult.user);
            }
        } else {
            setResult({
                success: false,
                message: 'Palm not recognized. Please try again.'
            });
            setScanning(false);
            stopCamera();
        }
    };

    const processPayment = async (userToCharge) => {
        try {
            const response = await fetch('/api/payment/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userToCharge.id,
                    amount,
                    pin: pin.join(''),
                    authMethod: amount > 500 ? 'biometric+pin' : 'biometric'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: 'Payment Successful!',
                    user: userToCharge,
                    amount,
                    newBalance: data.user.balance
                });

                if (userToCharge.id === user.id) {
                    updateUser({ balance: data.user.balance });
                }
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Payment failed'
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Network error. Please try again.'
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
    };

    return (
        <div className="payment-page">
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

                    {scanning && (
                        <button onClick={() => { setScanning(false); stopCamera(); }} className="btn-secondary">
                            Cancel Scan
                        </button>
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
                            className="modal-content glass-card"
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
                                {result.success ? '🎉 Payment Successful! 🎉' : result.message}
                            </motion.h2>

                            {result.success && (
                                <>
                                    <motion.p
                                        className="result-user"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        Paid to: {result.user.name}
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
                                        ✨ Transaction completed successfully with biometric authentication
                                    </motion.p>
                                </>
                            )}

                            <motion.button
                                onClick={closeResult}
                                className="btn-primary mt-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {result.success ? 'Done' : 'Try Again'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Payment;
