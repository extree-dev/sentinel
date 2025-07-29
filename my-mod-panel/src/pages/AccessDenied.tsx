// pages/AccessDenied.tsx
import { FiAlertOctagon, FiLogOut, FiMail } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './css/AccessDenied.css';

export default function AccessDenied() {
    const { logout, user } = useAuth();
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        document.title = "Доступ запрещен | Sentinel Panel";
    }, []);

    const handleRequestAccess = () => {
        // Здесь логика отправки запроса
        console.log(`Запрос прав от пользователя ${user?.username}`);
        setRequestSent(true);

        // Таймер для сброса статуса отправки
        setTimeout(() => setRequestSent(false), 5000);
    };

    return (
        <motion.div
            className="access-denied-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="parallax-container"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <motion.div
                    className="access-denied-card"
                    initial={{ y: -20, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 10
                    }}
                >
                    <div className="warning-icon-container">
                        <FiAlertOctagon className="warning-icon" />
                        <div className="pulse-effect" />
                    </div>

                    <h2>Доступ ограничен</h2>
                    <p className="description">
                        Для доступа к этой панели управления требуются дополнительные права.
                    </p>

                    <div className="roles-section">
                        <h3>Требуемые права:</h3>
                        <div className="roles-list">
                            <div className="role-badge">Главный Администратор</div>
                            <div className="role-badge">Senior Moderator</div>
                            <div className="role-badge">Moderator</div>
                        </div>
                    </div>

                    <div className="request-section">
                        <motion.p
                            className="admin-contact"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <motion.span
                                className="contact-prefix"
                                initial={{ x: -10 }}
                                animate={{ x: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 10
                                }}
                            >
                                <span className="prefix-line"></span>
                                <span className="prefix-text">
                                    Доступ предоставляет
                                </span>
                                <span className="prefix-line"></span>
                            </motion.span>
                            <motion.span
                                className="admin-name"
                                whileHover={{
                                    scale: 1.05,
                                    textShadow: "0 0 8px rgba(124, 58, 237, 0.5)"
                                }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <span className="admin-icon"></span>
                                @tisens
                                <span className="admin-title">Главный Администратор</span>
                            </motion.span>
                        </motion.p>

                        <motion.button
                            className="request-btn"
                            onClick={handleRequestAccess}
                            disabled={requestSent}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FiMail className="mail-icon" />
                            <span>{requestSent ? 'Запрос отправлен' : 'Запросить доступ'}</span>
                        </motion.button>
                    </div>

                    <motion.button
                        className="logout-btn"
                        onClick={logout}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                        <motion.span
                            animate={{ x: [-3, 3, -3] }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            }}
                        >
                            <FiLogOut />
                        </motion.span>
                        <span>Выйти из системы</span>
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}