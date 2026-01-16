const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    type: {
        type: String,
        enum: ['payment', 'topup', 'refund'],
        default: 'payment'
    },
    amount: {
        type: Number,
      
    },
    balanceBefore: {
        type: Number,
        
    },
    balanceAfter: {
        type: Number,
        
    },
    description: {
        type: String,
        default: ''
    },
    authMethod: {
        type: String,
        enum: ['biometric', 'pin', 'biometric+pin'],
        default: 'biometric'
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'success'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
