const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async register(username, email) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email }),
        });
    }

    async enrollPalm(userId, palmData) {
        return this.request('/auth/enroll-palm', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, palm_data: palmData }),
        });
    }

    async verifyPalm(userId, palmData) {
        return this.request('/auth/verify-palm', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, palm_data: palmData }),
        });
    }

    async getUser(userId) {
        return this.request(`/auth/user/${userId}`, {
            method: 'GET',
        });
    }

    async processGesture(gestureData) {
        return this.request('/gesture/process', {
            method: 'POST',
            body: JSON.stringify({ gesture_data: gestureData }),
        });
    }

    async getGestureHistory(limit = 10) {
        return this.request(`/gesture/history?limit=${limit}`, {
            method: 'GET',
        });
    }

    async createPayment(userId, amount, currency = 'USD', gestureType = null) {
        return this.request('/transaction/payment', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                amount,
                currency,
                gesture_type: gestureType,
            }),
        });
    }

    async createTrade(userId, asset, amount, tradeType = 'buy', gestureType = null) {
        return this.request('/transaction/trade', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                asset,
                amount,
                trade_type: tradeType,
                gesture_type: gestureType,
            }),
        });
    }

    async getTransaction(transactionId) {
        return this.request(`/transaction/${transactionId}`, {
            method: 'GET',
        });
    }

    async getUserTransactions(userId) {
        return this.request(`/transaction/user/${userId}`, {
            method: 'GET',
        });
    }

    async cancelTransaction(transactionId) {
        return this.request(`/transaction/${transactionId}/cancel`, {
            method: 'POST',
        });
    }

    async getTransactionStats() {
        return this.request('/transaction/stats', {
            method: 'GET',
        });
    }

    async getHealthStatus() {
        return this.request('/health', {
            method: 'GET',
        });
    }

    async getApiStats() {
        return this.request('/api/stats', {
            method: 'GET',
        });
    }
}

export const api = new ApiService();
