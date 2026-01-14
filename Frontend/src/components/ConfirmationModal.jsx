import React from 'react';

function ConfirmationModal({ transaction, onConfirm, onCancel }) {
  const getTransactionDetails = () => {
    if (transaction.type === 'payment') {
      return {
        title: 'Confirm Payment',
        icon: '💳',
        details: [
          { label: 'Amount', value: `${transaction.amount} ${transaction.currency}` },
          { label: 'Type', value: 'Payment' },
          { label: 'Gesture', value: transaction.gesture_type }
        ]
      };
    } else if (transaction.type === 'trade') {
      return {
        title: 'Confirm Trade',
        icon: '📈',
        details: [
          { label: 'Asset', value: transaction.asset },
          { label: 'Amount', value: transaction.amount },
          { label: 'Type', value: transaction.trade_type.toUpperCase() },
          { label: 'Gesture', value: transaction.gesture_type }
        ]
      };
    }
    return { title: 'Confirm Transaction', icon: '✓', details: [] };
  };

  const details = getTransactionDetails();

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">{details.icon}</span>
          <h2>{details.title}</h2>
        </div>

        <div className="modal-body">
          <div className="transaction-details">
            {details.details.map((detail, index) => (
              <div key={index} className="detail-row">
                <span className="detail-label">{detail.label}:</span>
                <span className="detail-value">{detail.value}</span>
              </div>
            ))}
          </div>

          <div className="security-notice">
            <span className="security-icon">🔒</span>
            <p>This transaction is secured by palm authentication</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Confirm Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
