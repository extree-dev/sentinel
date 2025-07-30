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
    const [requestSent, setRequestSent] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!discordTag.match(/^[a-z0-9_.]{2,32}$/)) {
            setError('Введите корректный Discord логин (например: username или user.name)');
            return;
        }

        if (discordTag.startsWith('.') || discordTag.startsWith('_') || 
            discordTag.endsWith('.') || discordTag.endsWith('_')) {
            setError('Логин не может начинаться или заканчиваться на точку или подчеркивание');
            return;
        }

        if (discordTag.includes('..')) {
            setError('Логин не может содержать две точки подряд');
            return;
        }

        if (discordTag.split('').every(c => c === '.')) {
            setError('Логин не может состоять только из точек');
            return;
        }

        setError('');
        setIsPending(true);

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
                const errorText = await response.text();
                throw new Error(errorText || 'Неизвестная ошибка сервера');
            }
        
            setRequestSent(true);
        } catch (err) {
            let errorMessage = 'Ошибка при отправке заявки. Попробуйте позже.';
            
            // Проверяем тип ошибки
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }
        
            setError(errorMessage);
            setIsPending(false);
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

                {requestSent ? (
                    <motion.div
                        className="verification-success"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <FiCheck className="success-icon" />
                        <h2>Заявка отправлена!</h2>
                        <p>Модераторы получили ваш запрос. Ожидайте решения.</p>
                        <p>Обычно проверка занимает до 24 часов.</p>
                    </motion.div>
                ) : isPending ? (
                    <motion.div
                        className="verification-pending"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <FiClock className="pending-icon" />
                        <h2>Заявка на рассмотрении</h2>
                        <p>Ваша заявка проверяется модераторами.</p>
                        <p>Вы получите уведомление, когда доступ будет предоставлен.</p>
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
                                onChange={(e) => setDiscordTag(e.target.value.toLowerCase())} // автоматически приводим к нижнему регистру
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
                            disabled={!discordTag || isPending}
                        >
                            <FiSend className="btn-icon" />
                            {isPending ? 'Отправка...' : 'Отправить заявку'}
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
}