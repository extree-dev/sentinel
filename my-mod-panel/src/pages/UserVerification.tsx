import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiUser, FiCheck, FiClock, FiAlertCircle, FiSend, FiRefreshCw, FiCopy, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './css/UserVerification.css';

export default function UserVerification() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [discordTag, setDiscordTag] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [error, setError] = useState('');
    const [requestId, setRequestId] = useState('');
    const [showToast, setShowToast] = useState(false);

    // Проверяем статус существующей заявки при загрузке
    useEffect(() => {
        if (user?.id) {
            checkExistingRequest();
        }

        const cards = document.querySelectorAll<HTMLElement>('.request-id-card');

        const handleMouseMove = (e: MouseEvent) => {
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        };

        cards.forEach(card => {
            card.addEventListener('mousemove', handleMouseMove);
        });

        return () => {
            cards.forEach(card => {
                card.removeEventListener('mousemove', handleMouseMove);
            });
        };
    }, [user, requestId]);

    const checkExistingRequest = async () => {
        setIsLoading(true);
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
                    setRequestId(data.requests[0].id); // Сохраняем ID заявки
                }
            }
        } catch (err) {
            console.error('Error checking request status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateDiscordTag(discordTag)) {
            return;
        }

        setError('');

        try {
            const avatarUrl = user?.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=256`
                : null;
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
                    avatar: user?.avatar,
                    avatarUrl // Добавляем полный URL
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Неизвестная ошибка сервера');
            }

            const responseData = await response.json();
            setRequestStatus('pending');
            setRequestId(responseData.requestId); // Сохраняем ID заявки из ответа
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(requestId);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000); // Автоматическое скрытие через 2 секунды
        } catch (err) {
            console.error('Copy failed:', err);
        }
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
                        {requestId && (
                            <motion.div
                                className="request-id-card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopy}
                                title="Нажмите, чтобы скопировать"
                            >
                                <div className="request-id-glow"></div>
                                <div className="request-id-content">
                                    <FiFileText className="request-id-icon" />
                                    <div className="request-id-text">
                                        <span className="request-id-label">Ваш номер заявки</span>
                                        <span className="request-id-value">{requestId}</span>
                                    </div>
                                    <FiCopy className="request-id-copy" />
                                </div>
                            </motion.div>
                        )}
                        <p>Ваша заявка проверяется модераторами.</p>
                        <p>Вы получите уведомление, когда доступ будет предоставлен.</p>
                        <button
                            className={`status-check-button ${isLoading ? 'loading' : ''}`}
                            onClick={checkExistingRequest}
                            disabled={isLoading}
                            aria-label={isLoading ? "Проверка статуса..." : "Проверить статус заявки"}
                        >
                            <div className="button-content">
                                <FiRefreshCw className="button-icon" />
                                <span className="button-text">
                                    {isLoading ? "Проверяем..." : "Проверить статус"}
                                </span>
                            </div>
                            <div className="button-hover-effect"></div>
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
                {showToast && (
                    <motion.div
                        className="toast visible"
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{
                            type: 'spring',
                            damping: 15,
                            stiffness: 120
                        }}
                        onMouseMove={(e) => {
                            const toast = e.currentTarget;
                            const rect = toast.getBoundingClientRect();
                            toast.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                            toast.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                        }}
                    >
                        <div className="toast-border" />
                        <FiCheck className="toast-icon" />
                        <span className="toast-content">Скопировано в буфер обмена</span>

                        {/* Эффект пульсации */}
                        <motion.span
                            className="absolute inset-0 rounded-[2rem] bg-[rgba(var(--liquid-accent),0.03)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </motion.div>
                )}
            </motion.div>
        </>
    );
}