import React, { useState, useEffect, useRef } from 'react';
import GestureOverlay from './components/GestureOverlay';
import ConfirmationModal from './components/ConfirmationModal';
import TransactionStatus from './components/TransactionStatus';
import { api } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [palmEnrolled, setPalmEnrolled] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    initializeCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const handleRegister = async (username, email) => {
    try {
      const response = await api.register(username, email);
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handlePalmEnrollment = async (palmData) => {
    try {
      const response = await api.enrollPalm(user.id, palmData);
      if (response.success) {
        setPalmEnrolled(true);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Palm enrollment failed:', error);
    }
  };

  const handlePalmVerification = async (palmData) => {
    try {
      const response = await api.verifyPalm(user.id, palmData);
      if (response.success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Palm verification failed:', error);
    }
  };

  const handleGestureDetected = async (gestureData) => {
    setCurrentGesture(gestureData);

    if (gestureData.action === 'payment') {
      setPendingTransaction({
        type: 'payment',
        amount: 100,
        currency: 'USD',
        gesture_type: gestureData.gesture_type
      });
      setShowConfirmation(true);
    } else if (gestureData.action === 'trade') {
      setPendingTransaction({
        type: 'trade',
        asset: 'BTC',
        amount: 0.001,
        trade_type: 'buy',
        gesture_type: gestureData.gesture_type
      });
      setShowConfirmation(true);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !user) return;

    try {
      let response;
      if (pendingTransaction.type === 'payment') {
        response = await api.createPayment(
          user.id,
          pendingTransaction.amount,
          pendingTransaction.currency,
          pendingTransaction.gesture_type
        );
      } else if (pendingTransaction.type === 'trade') {
        response = await api.createTrade(
          user.id,
          pendingTransaction.asset,
          pendingTransaction.amount,
          pendingTransaction.trade_type,
          pendingTransaction.gesture_type
        );
      }

      if (response.success) {
        setTransactions([...transactions, response]);
        setShowConfirmation(false);
        setPendingTransaction(null);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const handleCancelTransaction = () => {
    setShowConfirmation(false);
    setPendingTransaction(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>PlamPay</h1>
          <p className="tagline">Gesture-Powered Payments</p>
        </div>
        <div className="user-info">
          {user && (
            <>
              <span className="username">{user.username}</span>
              <div className={`status-indicator ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}>
                {isAuthenticated ? '🟢 Authenticated' : '🔴 Not Authenticated'}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!user ? (
          <div className="auth-section">
            <h2>Welcome to PlamPay</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleRegister(formData.get('username'), formData.get('email'));
            }}>
              <input type="text" name="username" placeholder="Username" required />
              <input type="email" name="email" placeholder="Email" required />
              <button type="submit" className="btn-primary">Register</button>
            </form>
          </div>
        ) : !palmEnrolled ? (
          <div className="enrollment-section">
            <h2>Enroll Your Palm</h2>
            <p>Place your palm in front of the camera</p>
            <video ref={videoRef} autoPlay playsInline className="camera-feed" />
            <button 
              onClick={() => handlePalmEnrollment({ lines: [], width: 100, height: 150 })}
              className="btn-primary"
            >
              Capture Palm
            </button>
          </div>
        ) : (
          <div className="main-interface">
            <div className="camera-section">
              <video ref={videoRef} autoPlay playsInline className="camera-feed" />
              <GestureOverlay 
                onGestureDetected={handleGestureDetected}
                currentGesture={currentGesture}
              />
            </div>

            <div className="dashboard-section">
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="gesture-guide">
                  <div className="gesture-item">
                    <span className="gesture-icon">👉</span>
                    <span>Swipe Right - Payment</span>
                  </div>
                  <div className="gesture-item">
                    <span className="gesture-icon">⭕</span>
                    <span>Circle - Trade</span>
                  </div>
                  <div className="gesture-item">
                    <span className="gesture-icon">👆</span>
                    <span>Tap - Confirm</span>
                  </div>
                  <div className="gesture-item">
                    <span className="gesture-icon">👈</span>
                    <span>Swipe Left - Cancel</span>
                  </div>
                </div>
              </div>

              <TransactionStatus transactions={transactions} />
            </div>
          </div>
        )}
      </main>

      {showConfirmation && pendingTransaction && (
        <ConfirmationModal
          transaction={pendingTransaction}
          onConfirm={handleConfirmTransaction}
          onCancel={handleCancelTransaction}
        />
      )}
    </div>
  );
}

export default App;
