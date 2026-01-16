import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import './History.css';

const History = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');

    // Mock transaction history
    const mockTransactions = [
        {
            id: '1',
            type: 'payment',
            description: 'Payment to Merchant ABC',
            amount: 250,
            date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            status: 'success',
            method: 'biometric'
        },
        {
            id: '2',
            type: 'topup',
            description: 'Account Top Up',
            amount: 5000,
            date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            status: 'success',
            method: 'card'
        },
        {
            id: '3',
            type: 'payment',
            description: 'Payment to Merchant XYZ',
            amount: 150,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            status: 'success',
            method: 'biometric'
        },
        {
            id: '4',
            type: 'topup',
            description: 'Account Top Up',
            amount: 2000,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'success',
            method: 'card'
        },
        {
            id: '5',
            type: 'payment',
            description: 'Payment to Shop Store',
            amount: 500,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            status: 'success',
            method: 'biometric'
        },
        {
            id: '6',
            type: 'payment',
            description: 'Online Purchase',
            amount: 1200,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            status: 'success',
            method: 'biometric+pin'
        },
        {
            id: '7',
            type: 'topup',
            description: 'Account Top Up',
            amount: 3000,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            status: 'success',
            method: 'card'
        },
        {
            id: '8',
            type: 'payment',
            description: 'Bill Payment',
            amount: 800,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            status: 'success',
            method: 'biometric'
        }
    ];

    const filteredTransactions = filter === 'all' 
        ? mockTransactions 
        : mockTransactions.filter(t => t.type === filter);

    const formatDate = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const totalPayments = mockTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalTopUps = mockTransactions
        .filter(t => t.type === 'topup')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="history-page">
            <div className="history-container">
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <motion.div
                    className="history-header glass-card"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="history-title">Transaction History</h1>
                    <p className="history-subtitle">View all your transactions</p>
                </motion.div>

                <motion.div
                    className="stats-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <StatCard
                        label="Total Transactions"
                        value={mockTransactions.length}
                        icon="📊"
                    />
                    <StatCard
                        label="Total Paid"
                        value={`${totalPayments} som`}
                        icon="💸"
                    />
                    <StatCard
                        label="Total Top Ups"
                        value={`${totalTopUps} som`}
                        icon="➕"
                    />
                </motion.div>

                <motion.div
                    className="filter-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="filter-title">
                        <Filter size={18} /> Filter
                    </h2>
                    <div className="filter-buttons">
                        <motion.button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            All Transactions
                        </motion.button>
                        <motion.button
                            className={`filter-btn ${filter === 'payment' ? 'active' : ''}`}
                            onClick={() => setFilter('payment')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Payments
                        </motion.button>
                        <motion.button
                            className={`filter-btn ${filter === 'topup' ? 'active' : ''}`}
                            onClick={() => setFilter('topup')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Top Ups
                        </motion.button>
                    </div>
                </motion.div>

                <motion.div
                    className="transactions-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {filteredTransactions.length > 0 ? (
                        <div className="transaction-items">
                            {filteredTransactions.map((transaction, index) => (
                                <motion.div
                                    key={transaction.id}
                                    className="transaction-item glass-card"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="transaction-icon">
                                        {transaction.type === 'payment' ? (
                                            <ArrowUpRight size={24} className="icon-payment" />
                                        ) : (
                                            <ArrowDownLeft size={24} className="icon-topup" />
                                        )}
                                    </div>

                                    <div className="transaction-details">
                                        <h3 className="transaction-desc">{transaction.description}</h3>
                                        <p className="transaction-method">
                                            {transaction.method === 'biometric' && '🔐 Biometric'}
                                            {transaction.method === 'biometric+pin' && '🔐 Biometric + PIN'}
                                            {transaction.method === 'card' && '💳 Card'}
                                        </p>
                                    </div>

                                    <div className="transaction-amount">
                                        <span className={transaction.type === 'payment' ? 'negative' : 'positive'}>
                                            {transaction.type === 'payment' ? '-' : '+'}{transaction.amount} som
                                        </span>
                                    </div>

                                    <div className="transaction-time">
                                        <span className="time">{formatDate(transaction.date)}</span>
                                        <span className="status success">✓ Success</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No transactions found</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon }) => (
    <motion.div
        className="stat-card glass-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
    >
        <div className="stat-icon">{icon}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
    </motion.div>
);

export default History;
