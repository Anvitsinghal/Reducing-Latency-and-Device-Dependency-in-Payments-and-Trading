import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import BiometricSetup from './pages/BiometricSetup';
import TopUp from './pages/TopUp';
import History from './pages/History';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-accent text-xl">Loading...</div>
        </div>;
    }

    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="cosmic-bg" />
                <div className="stars" />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/payment" element={
                        <ProtectedRoute>
                            <Payment />
                        </ProtectedRoute>
                    } />
                    <Route path="/biometric-setup" element={
                        <ProtectedRoute>
                            <BiometricSetup />
                        </ProtectedRoute>
                    } />
                    <Route path="/topup" element={
                        <ProtectedRoute>
                            <TopUp />
                        </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                        <ProtectedRoute>
                            <History />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
