import React, { useState, useEffect } from 'react';

function TransactionStatus({ transactions }) {
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0
  });

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const calculateStats = () => {
    const newStats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === 'completed').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      failed: transactions.filter(t => t.status === 'failed').length
    };
    setStats(newStats);
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.status === filter);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (transaction) => {
    if (transaction.transaction_type === 'payment') {
      return `${transaction.amount} ${transaction.currency}`;
    } else if (transaction.transaction_type === 'trade') {
      return `${transaction.amount} ${transaction.asset || 'BTC'}`;
    }
    return transaction.amount;
  };

  return (
    <div className="transaction-status">
      <div className="status-header">
        <h3>Transactions</h3>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-tab ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
      </div>

      <div className="transaction-list">
        {getFilteredTransactions().length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No transactions yet</p>
          </div>
        ) : (
          getFilteredTransactions().map((transaction, index) => (
            <div key={transaction.transaction_id || index} className="transaction-item">
              <div className="transaction-icon">
                {transaction.transaction_type === 'payment' ? '💳' : '📈'}
              </div>
              
              <div className="transaction-info">
                <div className="transaction-header">
                  <span className="transaction-type">
                    {transaction.transaction_type === 'payment' ? 'Payment' : 'Trade'}
                  </span>
                  <span className={getStatusClass(transaction.status)}>
                    {getStatusIcon(transaction.status)} {transaction.status}
                  </span>
                </div>
                
                <div className="transaction-details">
                  <span className="transaction-amount">{formatAmount(transaction)}</span>
                  {transaction.gesture_trigger && (
                    <span className="transaction-gesture">
                      Gesture: {transaction.gesture_trigger}
                    </span>
                  )}
                </div>
                
                {transaction.latency_ms && (
                  <div className="transaction-meta">
                    <span className="latency">⚡ {transaction.latency_ms.toFixed(0)}ms</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TransactionStatus;
