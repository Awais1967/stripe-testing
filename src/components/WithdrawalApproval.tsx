import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';
import { WithdrawalApiService } from '../services/withdrawalApiService';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  stripeTransferId?: string;
  reason?: string;
  stripeAccountId?: string;
}

interface ApprovalAction {
  requestId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

const WithdrawalApproval: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [approvalReason, setApprovalReason] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processingAction, setProcessingAction] = useState<string>('');

  useEffect(() => {
    loadWithdrawalRequests();
  }, []);

  const loadWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const requests = await WithdrawalApiService.getAllWithdrawalRequests();
      setWithdrawalRequests(requests);
    } catch (err: any) {
      console.error('Failed to load withdrawal requests:', err);
      setError('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setProcessingAction(action);
    setError('');
    setSuccess('');

    try {
      const response = await WithdrawalApiService.processWithdrawalRequest({
        requestId: selectedRequest.id,
        action: action,
        reason: approvalReason
      });

      setSuccess(`Withdrawal request ${action}d successfully!`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalReason('');
      
      // Reload requests
      await loadWithdrawalRequests();
    } catch (err: any) {
      console.error(`Failed to ${action} withdrawal request:`, err);
      setError(err.message || `Failed to ${action} withdrawal request`);
    } finally {
      setProcessingAction('');
    }
  };

  const openApprovalModal = (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'completed': return 'green';
      case 'rejected': return 'red';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const handleDismissError = () => setError('');
  const handleDismissSuccess = () => setSuccess('');

  const pendingRequests = withdrawalRequests.filter(req => req.status === 'pending');
  const otherRequests = withdrawalRequests.filter(req => req.status !== 'pending');

  return (
    <div className="withdrawal-approval-container">
      <h2>Withdrawal Approval Dashboard</h2>
      
      {error && (
        <div className="error-message dismissible">
          {error}
          <button onClick={handleDismissError} className="dismiss-btn">×</button>
        </div>
      )}
      
      {success && (
        <div className="success-message dismissible">
          {success}
          <button onClick={handleDismissSuccess} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="approval-stats">
        <div className="stat-card">
          <h3>Pending Requests</h3>
          <div className="stat-number">{pendingRequests.length}</div>
        </div>
        <div className="stat-card">
          <h3>Total Requests</h3>
          <div className="stat-number">{withdrawalRequests.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading withdrawal requests...</div>
      ) : (
        <>
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="requests-section">
              <h3>Pending Approval ({pendingRequests.length})</h3>
              <div className="requests-grid">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="request-card pending">
                    <div className="request-header">
                      <div className="user-info">
                        <h4>{request.userName}</h4>
                        <p>{request.userEmail}</p>
                      </div>
                      <div className="amount-info">
                        <div className="amount">{formatAmount(request.amount, request.currency)}</div>
                        <div className="currency">{request.currency.toUpperCase()}</div>
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="detail-item">
                        <label>Request ID:</label>
                        <span>{request.id}</span>
                      </div>
                      <div className="detail-item">
                        <label>User ID:</label>
                        <span>{request.userId}</span>
                      </div>
                      <div className="detail-item">
                        <label>Requested:</label>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      {request.stripeAccountId && (
                        <div className="detail-item">
                          <label>Stripe Account:</label>
                          <span>{request.stripeAccountId}</span>
                        </div>
                      )}
                    </div>

                    <div className="request-actions">
                      <button
                        onClick={() => openApprovalModal(request, 'approve')}
                        className="action-btn approve"
                        disabled={processingAction === 'approve'}
                      >
                        {processingAction === 'approve' ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => openApprovalModal(request, 'reject')}
                        className="action-btn reject"
                        disabled={processingAction === 'reject'}
                      >
                        {processingAction === 'reject' ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Requests Section */}
          {otherRequests.length > 0 && (
            <div className="requests-section">
              <h3>Other Requests ({otherRequests.length})</h3>
              <div className="requests-grid">
                {otherRequests.map((request) => (
                  <div key={request.id} className={`request-card ${request.status}`}>
                    <div className="request-header">
                      <div className="user-info">
                        <h4>{request.userName}</h4>
                        <p>{request.userEmail}</p>
                      </div>
                      <div className="amount-info">
                        <div className="amount">{formatAmount(request.amount, request.currency)}</div>
                        <div className="currency">{request.currency.toUpperCase()}</div>
                      </div>
                      <div className={`status-badge status-${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="detail-item">
                        <label>Request ID:</label>
                        <span>{request.id}</span>
                      </div>
                      <div className="detail-item">
                        <label>User ID:</label>
                        <span>{request.userId}</span>
                      </div>
                      <div className="detail-item">
                        <label>Requested:</label>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      {request.updatedAt !== request.createdAt && (
                        <div className="detail-item">
                          <label>Updated:</label>
                          <span>{formatDate(request.updatedAt)}</span>
                        </div>
                      )}
                      {request.stripeTransferId && (
                        <div className="detail-item">
                          <label>Stripe Transfer:</label>
                          <span>{request.stripeTransferId}</span>
                        </div>
                      )}
                      {request.reason && (
                        <div className="detail-item">
                          <label>Reason:</label>
                          <span>{request.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withdrawalRequests.length === 0 && (
            <div className="no-data">
              <p>No withdrawal requests found.</p>
            </div>
          )}
        </>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm {processingAction === 'approve' ? 'Approval' : 'Rejection'}</h3>
            
            <div className="modal-details">
              <p><strong>User:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})</p>
              <p><strong>Amount:</strong> {formatAmount(selectedRequest.amount, selectedRequest.currency)}</p>
              <p><strong>Request ID:</strong> {selectedRequest.id}</p>
            </div>

            <div className="form-group">
              <label htmlFor="approvalReason">Reason (Optional)</label>
              <textarea
                id="approvalReason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Enter reason for approval/rejection..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="action-btn secondary"
                disabled={processingAction !== ''}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprovalAction(processingAction === 'approve' ? 'approve' : 'reject')}
                className={`action-btn ${processingAction === 'approve' ? 'approve' : 'reject'}`}
                disabled={processingAction === ''}
              >
                {processingAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalApproval;
