import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock, FiUser, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import './css/VerificationRequests.css';

interface VerificationRequest {
  id: string;
  discordTag: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export default function VerificationRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/verification/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        }
      });
      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      await fetch(`/api/verification/approve/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        }
      });
      setRequests(requests.map(req => 
        req.id === requestId ? {...req, status: 'approved'} : req
      ));
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await fetch(`/api/verification/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
        }
      });
      setRequests(requests.map(req => 
        req.id === requestId ? {...req, status: 'rejected'} : req
      ));
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  const filteredRequests = requests.filter(req => 
    filter === 'all' ? true : req.status === filter
  );

  if (loading) {
    return <div className="vr-loading-screen">
      <div className="vr-spinner"></div>
      <p>Загрузка запросов...</p>
    </div>;
  }

  return (
    <div className="vr-container">
      <div className="vr-header">
        <h1 className="vr-title">
          <FiUser className="vr-title-icon" />
          Запросы на верификацию
        </h1>
        
        <div className="vr-controls">
          <div className="vr-filters">
            <button 
              className={`vr-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button 
              className={`vr-filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              <FiClock className="vr-filter-icon" /> Ожидание
            </button>
            <button 
              className={`vr-filter-btn ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              <FiCheck className="vr-filter-icon" /> Одобрено
            </button>
            <button 
              className={`vr-filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              <FiX className="vr-filter-icon" /> Отклонено
            </button>
          </div>
          
          <button 
            className="vr-refresh-btn"
            onClick={fetchRequests}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="vr-content">
        {filteredRequests.length === 0 ? (
          <div className="vr-empty-state">
            <FiAlertCircle className="vr-empty-icon" />
            <p>Нет запросов по выбранному фильтру</p>
          </div>
        ) : (
          <ul className="vr-requests-grid">
            {filteredRequests.map(request => (
              <li key={request.id} className={`vr-request-card vr-status-${request.status}`}>
                {/* ... остальная часть карточки запроса ... */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}