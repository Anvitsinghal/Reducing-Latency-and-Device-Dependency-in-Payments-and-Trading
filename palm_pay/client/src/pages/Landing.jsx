import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Scan, Shield, Zap, ArrowRight } from 'lucide-react';
import './Landing.css';

const Landing = () => {
    return (
        <div className="landing-page">
            <div className="landing-container">
                <motion.div
                    className="hero-section"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        PalmPay
                    </motion.h1>

                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        The Future of Biometric Payments
                    </motion.p>

                    <motion.p
                        className="hero-description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        Pay with your palm. Secure, instant, and revolutionary.
                    </motion.p>

                    <motion.div
                        className="hero-buttons"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <Link to="/register" className="btn-hero-primary">
                            Get Started <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="btn-hero-secondary">
                            Sign In
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="features-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    <FeatureCard
                        icon={<Scan size={32} />}
                        title="Palm Recognition"
                        description="Advanced AI-powered biometric authentication using your unique palm pattern"
                        delay={1.1}
                    />
                    <FeatureCard
                        icon={<Shield size={32} />}
                        title="Bank-Level Security"
                        description="Military-grade encryption with multi-factor authentication for large transactions"
                        delay={1.2}
                    />
                    <FeatureCard
                        icon={<Zap size={32} />}
                        title="Instant Payments"
                        description="Complete transactions in under 2 seconds with just a wave of your hand"
                        delay={1.3}
                    />
                </motion.div>

                <motion.div
                    className="stats-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                >
                    <StatCard number="99.9%" label="Accuracy" />
                    <StatCard number="<2s" label="Transaction Time" />
                    <StatCard number="256-bit" label="Encryption" />
                </motion.div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div
        className="feature-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        whileHover={{ scale: 1.05, y: -5 }}
    >
        <div className="feature-icon">{icon}</div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
    </motion.div>
);

const StatCard = ({ number, label }) => (
    <div className="stat-card">
        <div className="stat-number">{number}</div>
        <div className="stat-label">{label}</div>
    </div>
);

export default Landing;
