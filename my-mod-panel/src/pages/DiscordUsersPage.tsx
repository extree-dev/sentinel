// DiscordUsersPage.tsx
import { useState, useEffect } from 'react';
import { FiUser, FiClock, FiAward, FiRefreshCw } from 'react-icons/fi';
import './css/DiscordUsersPage.css';
import { type DiscordGuildMember } from '../types';

export default function DiscordUsersPage() {
    const [users, setUsers] = useState<DiscordGuildMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/guild-members');

                // Проверка типа контента
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Server returned non-JSON: ${text.substring(0, 100)}`);
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                const members = data.members.map((member: any) => ({
                    id: member.user.id,
                    username: member.user.global_name || member.user.username,
                    discriminator: member.user.discriminator,
                    avatar: member.user.avatar,
                    roles: member.roles,
                    joined_at: member.joined_at,
                    is_bot: member.user.bot || false
                }));

                setUsers(members);
            } catch (err) {
                let errorMessage = 'Неизвестная ошибка';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const getAvatarUrl = (user: DiscordGuildMember) => {
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
        }
        const defaultIndex = parseInt(user.discriminator) % 5 || 0;
        return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    };

    if (loading) {
        return (
            <div className="users-section">
                <div className="section-toolbar">
                    <h3>Управление пользователями</h3>
                </div>
                <div className="empty-state">
                    <div className="loader" />
                    <p>Загрузка пользователей...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="users-section">
                <div className="section-toolbar">
                    <h3>Управление пользователями</h3>
                </div>
                <div className="empty-state">
                    <FiUser size={48} />
                    <p className="error">{error}</p>
                </div>
            </div>
        );
    }

    return (

        <div className="users-section">
            <div className="section-toolbar">
                <div className="toolbar-left">
                    <h3>Управление пользователями</h3>
                    <div className="stats-badge">
                        <span>{users.filter(u => !u.is_bot).length} пользователей</span>
                        <span className="bot-count">
                            {users.filter(u => u.is_bot).length} ботов
                        </span>
                    </div>
                </div>

                <div className="toolbar-right">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Поиск пользователей..."
                            className="search-input"
                        />
                    </div>

                    <button className="primary-button">
                        <FiRefreshCw />
                        <span>Обновить</span>
                    </button>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <FiUser size={40} className="primary-icon" />
                    </div>
                    <h4>Нет пользователей</h4>
                    <p>Попробуйте изменить параметры фильтра или обновить список</p>
                    <button className="primary-button">
                        <FiRefreshCw />
                        <span>Обновить список</span>
                    </button>
                </div>
            ) : (
                <>
                    <div className="users-grid">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className={`user-card ${user.is_bot ? 'bot-card' : ''}`}
                            >
                                <div className="user-header">
                                    <div className="avatar-wrapper">
                                        <img
                                            src={getAvatarUrl(user)}
                                            alt={user.username}
                                            className="user-avatar"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                const defaultIndex = parseInt(user.discriminator) % 5 || 0;
                                                target.src = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
                                            }}
                                        />
                                        {user.is_bot && (
                                            <div className="bot-label">
                                                BOT
                                            </div>
                                        )}
                                    </div>

                                    <div className="user-info">
                                        <h4>
                                            {user.username}
                                            {user.discriminator !== '0' && (
                                                <span className="discriminator">
                                                    #{user.discriminator}
                                                </span>
                                            )}
                                        </h4>

                                        <div className="user-id">
                                            ID: {user.id.slice(0, 6)}...
                                        </div>
                                    </div>
                                </div>

                                <div className="user-meta">
                                    <div className="meta-item">
                                        <FiClock className="meta-icon" />
                                        <span>
                                            Присоединился: {new Date(user.joined_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>

                                    <div className="meta-item">
                                        <FiAward className="meta-icon" />
                                        <div className="roles-container">
                                            {user.roles.slice(0, 3).map((roleId, index) => (
                                                <span
                                                    key={roleId || `role-${index}`}
                                                    className="role-badge"
                                                >
                                                    {roleId}
                                                </span>
                                            ))}
                                            {user.roles.length > 3 && (
                                                <span className="role-more">
                                                    +{user.roles.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>

    );
}