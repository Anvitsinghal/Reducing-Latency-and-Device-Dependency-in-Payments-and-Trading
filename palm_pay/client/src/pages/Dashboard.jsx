import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, CreditCard, Scan, LogOut, Plus, History } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-container">
                <motion.div
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
                        <p className="dashboard-subtitle">Manage your PalmPay account</p>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <LogOut size={20} />
                        Logout
                    </button>
                </motion.div>

                <motion.div
                    className="balance-card glass-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="balance-header">
                        <Wallet size={24} />
                        <span>Available Balance</span>
                    </div>
                    <div className="balance-amount">
                        {user?.balance || 0} <span className="currency">som</span>
                    </div>
                    <div className="balance-status">
                        {user?.hasBiometrics ? (
                            <span className="status-active">
                                <Scan size={16} /> Biometric Active
                            </span>
                        ) : (
                            <span className="status-inactive">
                                <Scan size={16} /> Biometric Not Set
                            </span>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    className="quick-actions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        <ActionCard
                            icon={<CreditCard size={32} />}
                            title="Make Payment"
                            description="Pay with palm scan"
                            onClick={() => navigate('/payment')}
                            color="accent"
                        />
                        <ActionCard
                            icon={<Scan size={32} />}
                            title={user?.hasBiometrics ? 'Update Biometric' : 'Setup Biometric'}
                            description="Register your palm"
                            onClick={() => navigate('/biometric-setup')}
                            color="primary"
                        />
                        <ActionCard
                            icon={<Plus size={32} />}
                            title="Top Up"
                            description="Add balance"
                            onClick={() => navigate('/topup')}
                            color="success"
                        />
                        <ActionCard
                            icon={<History size={32} />}
                            title="History"
                            description="View transactions"
                            onClick={() => navigate('/history')}
                            color="info"
                        />
                    </div>
                </motion.div>

                <motion.div
                    className="account-info glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="info-title">Account Information</h3>
                    <div className="info-grid">
                        <InfoItem label="Email" value={user?.email} />
                        <InfoItem label="Account ID" value={user?.id?.slice(0, 8) + '...'} />
                        <InfoItem
                            label="Security Level"
                            value={user?.hasBiometrics ? 'High (Biometric)' : 'Standard'}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const ActionCard = ({ icon, title, description, onClick, color }) => (
    <motion.div
        className={`action-card glass-card action-${color}`}
        onClick={onClick}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
    >
        <div className="action-icon">{icon}</div>
        <h3 className="action-title">{title}</h3>
        <p className="action-description">{description}</p>
    </motion.div>
);

const InfoItem = ({ label, value }) => (
    <div className="info-item">
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
    </div>
);

export default Dashboard;
