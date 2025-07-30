import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiUser, FiCheck, FiClock, FiAlertCircle, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './css/UserVerification.css';

export default function UserVerification() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [discordTag, setDiscordTag] = useState('');
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [error, setError] = useState('');

    // Проверяем статус существующей заявки при загрузке
    useEffect(() => {
        if (user?.id) {
            checkExistingRequest();
        }
    }, [user]);

    const checkExistingRequest = async () => {
        try {
            const response = await fetch(`/api/verification/requests?user_id=${user?.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.requests.length > 0) {
                    setRequestStatus(data.requests[0].status);
                }
            }
        } catch (err) {
            console.error('Error checking request status:', err);
        }
    };

    const handleSubmit = async () => {
        if (!validateDiscordTag(discordTag)) {
            return;
        }

        setError('');
        
        try {
            const response = await fetch('/api/verification/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('discord_access_token')}`
                },
                body: JSON.stringify({
                    discordTag,
                    userId: user?.id,
                    username: user?.username,
                    avatar: user?.avatar
                }),
            });
        
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Неизвестная ошибка сервера');
            }
        
            setRequestStatus('pending');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при отправке заявки');
        }
    };

    const validateDiscordTag = (tag: string) => {
        if (!tag.match(/^[a-z0-9_.]{2,32}$/)) {
            setError('Введите корректный Discord логин (например: username или user.name)');
            return false;
        }

        if (tag.startsWith('.') || tag.startsWith('_') || 
            tag.endsWith('.') || tag.endsWith('_')) {
            setError('Логин не может начинаться или заканчиваться на точку или подчеркивание');
            return false;
        }

        if (tag.includes('..')) {
            setError('Логин не может содержать две точки подряд');
            return false;
        }

        if (tag.split('').every(c => c === '.')) {
            setError('Логин не может состоять только из точек');
            return false;
        }

        return true;
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <div className="parallax-bg">
                <div className="bg-element bg-1"></div>
                <div className="bg-element bg-2"></div>
                <div className="bg-element bg-3"></div>
            </div>
            <motion.div
                className="verification-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="verification-header">
                    <h1>Заявка на доступ к серверу</h1>
                    <p>После проверки модераторами вам откроются все каналы Discord</p>
                </div>

                {requestStatus === 'approved' ? (
                    <motion.div
                        className="verification-success"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <FiCheck className="success-icon" />
                        <h2>Заявка одобрена!</h2>
                        <p>Теперь у вас есть доступ ко всем каналам сервера.</p>
                        <button 
                            className="return-btn"
                            onClick={() => navigate('/')}
                        >
                            Вернуться на главную
                        </button>
                    </motion.div>
                ) : requestStatus === 'rejected' ? (
                    <motion.div
                        className="verification-rejected"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <FiAlertCircle className="rejected-icon" />
                        <h2>Заявка отклонена</h2>
                        <p>Ваша заявка на верификацию была отклонена модераторами.</p>
                        <p>Попробуйте подать заявку снова, исправив указанные замечания.</p>
                        <button 
                            className="retry-btn"
                            onClick={() => setRequestStatus('none')}
                        >
                            Подать новую заявку
                        </button>
                    </motion.div>
                ) : requestStatus === 'pending' ? (
                    <motion.div
                        className="verification-pending"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <FiClock className="pending-icon" />
                        <h2>Заявка на рассмотрении</h2>
                        <p>Ваша заявка проверяется модераторами.</p>
                        <p>Вы получите уведомление, когда доступ будет предоставлен.</p>
                        <button 
                            className="check-status-btn"
                            onClick={checkExistingRequest}
                        >
                            Проверить статус
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="verification-form"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="form-group">
                            <label>
                                <FiUser className="input-icon" />
                                Ваш Discord Tag
                            </label>
                            <input
                                type="text"
                                value={discordTag}
                                onChange={(e) => setDiscordTag(e.target.value.toLowerCase())}
                                placeholder="username"
                            />
                            <p className="hint">Укажите ваш Discord логин (только строчные буквы, цифры, точки и подчеркивания)</p>
                        </div>

                        {error && (
                            <div className="error-message">
                                <FiAlertCircle /> {error}
                            </div>
                        )}

                        <div className="verification-info">
                            <h3>Что будет после подачи заявки?</h3>
                            <ul>
                                <li>Ваш запрос поступит модераторам на рассмотрение</li>
                                <li>При одобрении вам откроются все каналы сервера</li>
                                <li>Обычно проверка занимает до 24 часов</li>
                            </ul>
                        </div>

                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={!discordTag}
                        >
                            <FiSend className="btn-icon" />
                            Отправить заявку
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
}