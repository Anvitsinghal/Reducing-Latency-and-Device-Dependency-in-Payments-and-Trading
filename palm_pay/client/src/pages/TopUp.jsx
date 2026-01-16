import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, CreditCard } from 'lucide-react';
import './TopUp.css';

const TopUp = () => {
    const [selectedAmount, setSelectedAmount] = useState(500);
    const [customAmount, setCustomAmount] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const presetAmounts = [100, 500, 1000, 5000, 10000];

    const handleTopUp = async () => {
        setIsProcessing(true);
        
        // Simulate payment processing
        setTimeout(() => {
            const amount = customAmount ? parseInt(customAmount) : selectedAmount;
            const newBalance = (user.balance || 0) + amount;
            
            updateUser({ balance: newBalance });
            
            setShowResult({
                success: true,
                amount,
                newBalance,
                timestamp: new Date().toLocaleTimeString()
            });
            
            setIsProcessing(false);
        }, 1500);
    };

    const topUpAmount = customAmount ? parseInt(customAmount) : selectedAmount;

    return (
        <div className="topup-page">
            <div className="topup-container">
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <motion.div
                    className="topup-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="topup-title">Add Balance</h1>

                    <div className="current-balance">
                        <span>Current Balance:</span>
                        <span className="balance-value">{user?.balance || 0} som</span>
                    </div>

                    <div className="section">
                        <h2 className="section-title">Select Amount</h2>
                        <div className="preset-amounts">
                            {presetAmounts.map((amount) => (
                                <motion.button
                                    key={amount}
                                    className={`amount-btn ${selectedAmount === amount && !customAmount ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedAmount(amount);
                                        setCustomAmount('');
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    +{amount}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="section">
                        <h2 className="section-title">Or Enter Custom Amount</h2>
                        <input
                            type="number"
                            className="custom-input"
                            placeholder="Enter amount in som"
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedAmount(0);
                            }}
                            min="50"
                            max="50000"
                        />
                    </div>

                    <div className="summary">
                        <div className="summary-item">
                            <span>Top Up Amount:</span>
                            <span className="accent">{topUpAmount} som</span>
                        </div>
                        <div className="summary-item highlight">
                            <span>New Balance:</span>
                            <span className="amount">{(user?.balance || 0) + topUpAmount} som</span>
                        </div>
                    </div>

                    <motion.button
                        onClick={handleTopUp}
                        disabled={isProcessing}
                        className="btn-primary topup-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner-small"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                Proceed Top Up
                            </>
                        )}
                    </motion.button>
                </motion.div>

                {showResult && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="modal-content glass-card success-modal"
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                        >
                            <motion.div
                                className="result-icon success"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                <Check size={48} />
                            </motion.div>

                            <motion.h2
                                className="result-title text-success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                ✅ Top Up Successful!
                            </motion.h2>

                            <motion.div
                                className="result-details"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="detail-item">
                                    <span>Amount Added:</span>
                                    <span className="amount">{showResult.amount} som</span>
                                </div>
                                <div className="detail-item">
                                    <span>New Balance:</span>
                                    <span className="amount highlight">{showResult.newBalance} som</span>
                                </div>
                                <div className="detail-item">
                                    <span>Time:</span>
                                    <span>{showResult.timestamp}</span>
                                </div>
                            </motion.div>

                            <motion.button
                                onClick={() => navigate('/dashboard')}
                                className="btn-primary mt-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Back to Dashboard
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TopUp;
