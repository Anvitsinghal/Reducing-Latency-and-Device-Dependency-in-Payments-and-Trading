const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/payment/process
// @desc    Process a payment
router.post('/process', async (req, res) => {
    const { userId, amount, pin, authMethod } = req.body;

    try {
        if (!userId || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId format' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify PIN if amount > 500
        if (amount > 500) {
            if (!pin || pin !== user.pin) {
                return res.status(401).json({ message: 'Invalid PIN' });
            }
        }

        // Check balance
        if (user.balance < amount) {
            return res.status(400).json({
                message: 'Insufficient balance',
                balance: user.balance
            });
        }

        // Process payment
        const balanceBefore = user.balance;
        user.balance -= amount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            userId: user._id,
            type: 'payment',
            amount,
            balanceBefore,
            balanceAfter: user.balance,
            authMethod: authMethod || 'biometric',
            status: 'success'
        });
        await transaction.save();

        res.json({
            success: true,
            message: 'Payment successful',
            transaction: {
                id: transaction._id,
                amount,
                balanceBefore,
                balanceAfter: user.balance,
                timestamp: transaction.createdAt
            },
            user: {
                name: user.name,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/payment/history
// @desc    Get transaction history
router.get('/history', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/payment/topup
// @desc    Add balance (for demo purposes)
router.post('/topup', protect, async (req, res) => {
    const { amount } = req.body;

    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findById(req.user._id);
        const balanceBefore = user.balance;
        user.balance += amount;
        await user.save();

        const transaction = new Transaction({
            userId: user._id,
            type: 'topup',
            amount,
            balanceBefore,
            balanceAfter: user.balance,
            authMethod: 'pin',
            status: 'success'
        });
        await transaction.save();

        res.json({
            success: true,
            message: 'Balance topped up',
            balance: user.balance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
