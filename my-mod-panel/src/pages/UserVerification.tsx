// pages/UserVerification.tsx
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

    // Проверяем статус верификации пользователя
    useEffect(() => {
        if (user?.isVerified) {
            navigate('/dashboard');
        } else if (user?.verificationStatus === 'pending') {
            setIsPending(true);
        }
    }, [user, navigate]);

    const handleSubmit = async () => {
        if (!discordTag.match(/^.{3,32}#[0-9]{4}$/)) {
            setError('Введите корректный Discord Tag (например: User#1234)');
            return;
        }

        setError('');
        setIsPending(true);

        try {
            // Здесь будет запрос на отправку заявки админам
            await new Promise(resolve => setTimeout(resolve, 1000));
            setRequestSent(true);
            
            // Имитация ответа от сервера
            setTimeout(() => {
                setIsPending(false);
                setRequestSent(false);
            }, 5000);
        } catch (err) {
            setError('Ошибка при отправке заявки. Попробуйте позже.');
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
                            onChange={(e) => setDiscordTag(e.target.value)}
                            placeholder="Username#1234"
                        />
                        <p className="hint">Укажите ваш точный Discord Tag (имя пользователя и цифры)</p>
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
    );
}