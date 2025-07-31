import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock, FiUser, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import './css/VerificationRequests.css';
import { type DiscordRole, type VerificationRequest } from '../types';

export default function VerificationRequests() {
    const MODERATOR_ROLE_ID = '1399388382492360908'; // Замените на реальный ID роли модератора
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [moderatorComment, setModeratorComment] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('discord_access_token');
                if (!token) {
                    console.error('No token found');
                    return;
                }

                const response = await fetch('/api/discord/user-full', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('User data from API:', data);

                // Важно: проверьте, как сервер возвращает информацию о модераторе
                setCurrentUser({
                    ...data,
                    isModerator: data.roles?.some((role: DiscordRole) => role.id === MODERATOR_ROLE_ID) || false
                });
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchCurrentUser();
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/verification/requests?status=${filter === 'all' ? '' : filter}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch requests');
            }

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
    }, [filter]);

    const handleApprove = async (requestId: string) => {
        if (!currentUser?.id) return;

        try {
            const response = await fetch(`/api/verification/approve/${requestId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moderatorId: currentUser.id,
                    comment: moderatorComment
                })
            });

            if (!response.ok) {
                throw new Error('Approval failed');
            }

            await fetchRequests();
            setModeratorComment('');
        } catch (error) {
            console.error('Approval failed:', error);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!currentUser?.id) return;

        try {
            const response = await fetch(`/api/verification/reject/${requestId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moderatorId: currentUser.id,
                    comment: moderatorComment
                })
            });

            if (!response.ok) {
                throw new Error('Rejection failed');
            }

            await fetchRequests();
            setModeratorComment('');
        } catch (error) {
            console.error('Rejection failed:', error);
        }
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(req => req.status === filter);

    if (loading && requests.length === 0) {
        return (
            <div className="vr-loading-screen">
                <div className="vr-spinner"></div>
                <p>Загрузка запросов...</p>
            </div>
        );
    }

    return (
        <div className="verification-dashboard">
            <header className="dashboard-header">
                <div className="header-content">

                    <div className="header-controls">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Все
                            </button>
                            <button
                                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                                onClick={() => setFilter('pending')}
                            >
                                <FiClock className="filter-icon" /> Ожидание
                            </button>
                            <button
                                className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                                onClick={() => setFilter('approved')}
                            >
                                <FiCheck className="filter-icon" /> Одобрено
                            </button>
                            <button
                                className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
                                onClick={() => setFilter('rejected')}
                            >
                                <FiX className="filter-icon" /> Отклонено
                            </button>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={fetchRequests}
                            disabled={loading}
                            aria-label="Обновить"
                        >
                            <FiRefreshCw className={`refresh-icon ${loading ? 'spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>
            <main className="requests-container">
                {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                        <FiAlertCircle className="empty-icon" />
                        <p>Нет запросов по выбранному фильтру</p>
                    </div>
                ) : (
                    <ul className="requests-grid">
                        {filteredRequests.map(request => (
                            console.log('Request status:', request.status),
                            <li key={request.id} className={`request-card status-${request.status}`}>
                                <div className="card-header">
                                    {request.user.avatarUrl ? (
                                        <img
                                            src={request.user.avatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(request.user.discriminator) % 5}.png`}
                                            alt={`${request.user.username}'s avatar`}
                                            className="user-avatar"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(request.user.discriminator) % 5}.png`;
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="avatar-placeholder"
                                            data-user-id={request.user.id}
                                            style={{ display: request.user.avatarUrl ? 'none' : 'flex' }}
                                        >
                                            <FiUser />
                                        </div>
                                    )}
                                    <div className="user-info-request">
                                        <h3 className="username-request">{request.user.username}</h3>
                                        <p className="user-tag">{request.discordTag}</p>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="request-meta">
                                        <span className="request-id">ID: {request.id}</span>
                                        <span className="request-date">
                                            {new Date(request.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {request.status !== 'pending' && (
                                        <div className="moderation-info">
                                            <p className="moderation-status">
                                                <strong>{request.status === 'approved' ? 'Одобрено' : 'Отклонено'}</strong>
                                                {request.updatedAt && ` ${new Date(request.updatedAt).toLocaleString()}`}
                                            </p>
                                            {request.moderatorComment && (
                                                <p className="moderation-comment">{request.moderatorComment}</p>
                                            )}
                                        </div>
                                    )}
                                    {currentUser?.isModerator && (
                                        <div className="moderator-comment">
                                            <textarea
                                                className="comment-input"
                                                placeholder="Комментарий модератора (необязательно)"
                                                value={moderatorComment}
                                                onChange={(e) => setModeratorComment(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {request.status === 'pending' && currentUser?.isModerator && (
                                        <div className="action-buttons">
                                            <button
                                                className="action-button approve"
                                                onClick={() => handleApprove(request.id)}
                                            >
                                                <FiCheck /> Одобрить
                                            </button>
                                            <button
                                                className="action-button reject"
                                                onClick={() => handleReject(request.id)}
                                            >
                                                <FiX /> Отклонить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}