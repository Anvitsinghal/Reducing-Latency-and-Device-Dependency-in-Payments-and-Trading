const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/biometric/register
// @desc    Register biometric embeddings for user
router.post('/register', protect, async (req, res) => {
    const { embeddings } = req.body;

    try {
        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            return res.status(400).json({ message: 'Invalid embeddings data' });
        }

        const user = await User.findById(req.user._id);
        user.biometricEmbeddings = embeddings;
        await user.save();

        res.json({
            message: 'Biometric data registered successfully',
            hasBiometrics: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/biometric/verify
// @desc    Verify biometric embedding and return user
router.post('/verify', async (req, res) => {
    const { embedding } = req.body;

    try {
        if (!embedding || !Array.isArray(embedding)) {
            return res.status(400).json({ message: 'Invalid embedding data' });
        }

        // Get all users with biometric data
        const users = await User.find({
            biometricEmbeddings: { $exists: true, $ne: [] }
        });

        let bestMatch = null;
        let bestScore = 0;
        const MIN_CONFIDENCE = 0.75;

        // Find best matching user
        users.forEach(user => {
            let totalSimilarity = 0;
            user.biometricEmbeddings.forEach(userEmbedding => {
                const similarity = cosineSimilarity(embedding, userEmbedding);
                totalSimilarity += similarity;
            });
            const avgSimilarity = totalSimilarity / user.biometricEmbeddings.length;

            if (avgSimilarity > bestScore && avgSimilarity >= MIN_CONFIDENCE) {
                bestScore = avgSimilarity;
                bestMatch = user;
            }
        });

        if (bestMatch) {
            res.json({
                matched: true,
                confidence: bestScore,
                user: {
                    id: bestMatch._id,
                    name: bestMatch.name,
                    balance: bestMatch.balance,
                    pin: bestMatch.pin
                }
            });
        } else {
            res.json({
                matched: false,
                confidence: bestScore,
                message: 'No matching biometric found'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function: Cosine Similarity
function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

module.exports = router;
