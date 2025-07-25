import { useState, useEffect, useCallback } from 'react';
import { FiUser, FiAlertTriangle } from 'react-icons/fi';
import './css/Dashboard.css';
import { type DiscordGuildMember } from '../types';

export default function DiscordUsersPage() {
  const [guildMembers, setGuildMembers] = useState<DiscordGuildMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuildMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/guild-members', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Ошибка HTTP! Статус: ${response.status}`);
      }

      const data = await response.json();
      setGuildMembers(data.members || []);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuildMembers();
  }, [fetchGuildMembers]);

  const getAvatarUrl = (userId: string, avatarHash: string | null, discriminator: string) => {
    if (avatarHash) {
      return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=80`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;
  };

  const MemberCard = ({ member }: { member: DiscordGuildMember }) => {
    const displayName = member.nick || member.user.username;
    const joinDate = new Date(member.joined_at).toLocaleDateString();

    return (
      <div className="member-card">
        <div className="member-avatar-container">
          <img
            src={getAvatarUrl(member.user.id, member.user.avatar, member.user.discriminator)}
            alt={`${displayName}'s avatar`}
            className="member-avatar"
            crossOrigin="anonymous"
          />
          {member.user.bot && <span className="bot-badge">BOT</span>}
        </div>

        <div className="member-info">
          <h4 className="member-name">
            {displayName}
            <span className="member-tag">#{member.user.discriminator}</span>
          </h4>

          <div className="member-meta">
            <span className="member-joined">На сервере с: {joinDate}</span>
            <span className="member-roles">
              Роли: {member.roles.length > 0 ? member.roles.join(', ') : 'Нет ролей'}
            </span>
          </div>
        </div>

        <div className="member-actions">
          <button className="btn action-btn warn">Предупредить</button>
          <button className="btn action-btn mute">Мьют</button>
        </div>
      </div>
    );
  };

  return (
    <div className="users-section">
      <div className="section-toolbar">
        <h3>Управление пользователями</h3>
        <button
          className="btn refresh-btn"
          onClick={fetchGuildMembers}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span> Обновление...
            </>
          ) : (
            'Обновить'
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка пользователей...</p>
        </div>
      ) : (
        <div className="members-list">
          {guildMembers.length === 0 ? (
            <div className="empty-state">
              <FiUser size={48} />
              <p>Нет пользователей для отображения</p>
            </div>
          ) : (
            guildMembers.map((member) => (
              <MemberCard key={member.user.id} member={member} />
            ))
          )}
        </div>
      )}
    </div>
  );
}