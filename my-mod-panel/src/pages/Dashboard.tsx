import { useState, useEffect } from 'react';
import { FiSettings, FiActivity, FiShield, FiUser, FiAlertTriangle, FiClock } from 'react-icons/fi';
import './css/Dashboard.css';

type TabType = 'moderation' | 'analytics' | 'settings' | 'users';
type CaseType = 'ban' | 'warn' | 'mute' | 'report';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  isAdmin?: boolean;
}

interface ModerationCase {
  id: string;
  userId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  type: CaseType;
  reason: string;
  createdAt: string;
  handled?: boolean;
}

interface DiscordGuildUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  roles: string[];
  joinedAt: string;
  isBot?: boolean;
}


interface DiscordGuildMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
  };
  roles: string[];
  joined_at: string;
  nick?: string | null;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('moderation');
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [guildMembers, setGuildMembers] = useState<DiscordGuildMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);


  const fetchGuildMembers = async () => {
    setLoadingMembers(true);
    setMembersError(null);
    
    try {
      
      const response = await fetch('http://localhost:3001/api/guild-members', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setGuildMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMembersError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
    } finally {
      setLoadingMembers(false);
    }
  };


  useEffect(() => {

    if (activeTab === 'users') {
      fetchGuildMembers();
    }

    // Имитация загрузки пользователя
    setTimeout(() => {
      setUser({
        id: '123456789',
        username: 'AdminModer',
        discriminator: '0001',
        avatar: 'a1b2c3d4e5',
        isAdmin: true
      });
      setLoading(false);
    }, 1000);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Загрузка панели...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-layout ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="main-content">
        <div className="content-header">
          <h2>
            {activeTab === 'moderation' && <><FiShield /> Модерация</>}
            {activeTab === 'analytics' && <><FiActivity /> Аналитика</>}
            {activeTab === 'users' && <><FiUser /> Пользователи</>}
            {activeTab === 'settings' && <><FiSettings /> Настройки</>}
          </h2>
          <div className="header-actions">
            <button className="btn notification-btn">
              <FiAlertTriangle />
              <span className="badge">3</span>
            </button>
          </div>
        </div>

        <div className="content-section">
          {activeTab === 'moderation' && <ModerationSection user={user} />}
          {activeTab === 'analytics' && <AnalyticsSection />}
          {activeTab === 'users' && (
            <UsersSection
              members={guildMembers}
              loading={loadingMembers}
              error={membersError}
              onRefresh={fetchGuildMembers} // Добавляем пропс
            />
          )}
          {activeTab === 'settings' && <SettingsSection darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />}
        </div>
      </main>
    </div>
  );
}

const Sidebar = ({ user, activeTab, onTabChange, darkMode, toggleDarkMode }: {
  user: DiscordUser | null;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}) => (
  <aside className="sidebar">
    <div className="logo">
      <span>Sentinel</span>Mod
    </div>

    <nav className="nav-menu">
      <NavButton
        icon={<FiShield />}
        active={activeTab === 'moderation'}
        onClick={() => onTabChange('moderation')}
      >
        Модерация
      </NavButton>

      <NavButton
        icon={<FiActivity />}
        active={activeTab === 'analytics'}
        onClick={() => onTabChange('analytics')}
      >
        Аналитика
      </NavButton>

      <NavButton
        icon={<FiUser />}
        active={activeTab === 'users'}
        onClick={() => onTabChange('users')}
      >
        Пользователи
      </NavButton>

      <NavButton
        icon={<FiSettings />}
        active={activeTab === 'settings'}
        onClick={() => onTabChange('settings')}
      >
        Настройки
      </NavButton>
    </nav>

    <div className="sidebar-footer">
      <div className="user-card">
        <img
          src={user?.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=80`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.discriminator || '0') % 5}.png`
          }
          alt="User Avatar"
          className="user-avatar"
        />
        <div className="user-info">
          <span className="username">{user?.username || 'Модератор'}</span>
          <span className="user-tag">#{user?.discriminator || '0000'}</span>
        </div>
      </div>

      <button className="theme-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  </aside>
);

const NavButton = ({ icon, children, active, onClick }: {
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={`nav-btn ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <span className="nav-icon">{icon}</span>
    <span className="nav-text">{children}</span>
  </button>
);

const ModerationSection = ({ user }: { user: DiscordUser | null }) => {
  const [activeFilter, setActiveFilter] = useState<CaseType | 'all'>('all');
  const [cases, setCases] = useState<ModerationCase[]>([]);

  useEffect(() => {
    // Имитация загрузки случаев
    const mockCases: ModerationCase[] = [
      {
        id: '1',
        userId: '987654321',
        username: 'RuleBreaker',
        discriminator: '13',
        avatar: 'f1e2d3c4b5',
        type: 'ban',
        reason: 'Множественные нарушения правил',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        handled: false
      },
      {
        id: '2',
        userId: '567891234',
        username: 'Spammer',
        discriminator: '12',
        avatar: null,
        type: 'warn',
        reason: 'Рассылка рекламы',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        handled: true
      },
      {
        id: '3',
        userId: '345678912',
        username: 'ToxicPlayer',
        discriminator: '14',
        avatar: 'a5b4c3d2e1',
        type: 'report',
        reason: 'Токсичное поведение в чате',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        handled: false
      }
    ];
    setCases(mockCases);
  }, []);

  const handleCaseAction = (caseId: string, action: 'approve' | 'reject') => {
    setCases(cases.map(c =>
      c.id === caseId ? { ...c, handled: true, status: action } : c
    ));
  };

  const filteredCases = activeFilter === 'all'
    ? cases
    : cases.filter(c => c.type === activeFilter);

  return (
    <div className="moderation-section">
      <div className="section-toolbar">
        <div className="filter-tabs">
          {['all', 'report', 'warn', 'ban', 'mute'].map(filter => (
            <button
              key={filter}
              className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter as CaseType | 'all')}
            >
              {filter === 'all' && 'Все'}
              {filter === 'report' && 'Жалобы'}
              {filter === 'warn' && 'Предупреждения'}
              {filter === 'ban' && 'Баны'}
              {filter === 'mute' && 'Мьюты'}
            </button>
          ))}
        </div>

        <div className="search-box">
          <input type="text" placeholder="Поиск..." />
        </div>
      </div>

      <div className="cases-list">
        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <FiClock size={48} />
            <p>Нет случаев для отображения</p>
          </div>
        ) : (
          filteredCases.map(caseItem => (
            <CaseCard
              key={caseItem.id}
              caseData={caseItem}
              onApprove={() => handleCaseAction(caseItem.id, 'approve')}
              onReject={() => handleCaseAction(caseItem.id, 'reject')}
              currentUser={user}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CaseCard = ({ caseData, onApprove, onReject, currentUser }: {
  caseData: ModerationCase;
  onApprove: () => void;
  onReject: () => void;
  currentUser: DiscordUser | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`case-card ${caseData.handled ? 'handled' : ''} ${caseData.type}`}>
      <div className="case-header" onClick={() => setExpanded(!expanded)}>
        <div className="case-user-info">
          <img
            src={caseData.avatar
              ? `https://cdn.discordapp.com/avatars/${caseData.userId}/${caseData.avatar}.webp?size=40`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(caseData.discriminator || '0') % 5}.png`
            }
            alt="User Avatar"
            className="case-avatar"
          />
          <span className="case-username">{caseData.username}</span>
          <span className={`case-type ${caseData.type}`}>
            {caseData.type === 'ban' && 'Бан'}
            {caseData.type === 'warn' && 'Предупреждение'}
            {caseData.type === 'mute' && 'Мьют'}
            {caseData.type === 'report' && 'Жалоба'}
          </span>
        </div>

        <div className="case-meta">
          <span className="case-date">
            {new Date(caseData.createdAt).toLocaleString()}
          </span>
          <span className="case-status">
            {caseData.handled ? 'Обработано' : 'В ожидании'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="case-details">
          <div className="case-reason">
            <h4>Причина:</h4>
            <p>{caseData.reason}</p>
          </div>

          {!caseData.handled && currentUser?.isAdmin && (
            <div className="case-actions">
              <button className="btn approve-btn" onClick={onApprove}>
                Подтвердить
              </button>
              <button className="btn reject-btn" onClick={onReject}>
                Отклонить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalyticsSection = () => (
  <div className="analytics-section">
    <h3>Статистика модерации</h3>
    <div className="stats-grid">
      <div className="stat-card">
        <h4>Всего нарушений</h4>
        <p className="stat-value">124</p>
      </div>
      <div className="stat-card">
        <h4>Банов</h4>
        <p className="stat-value">42</p>
      </div>
      <div className="stat-card">
        <h4>Предупреждений</h4>
        <p className="stat-value">67</p>
      </div>
      <div className="stat-card">
        <h4>Активных модераторов</h4>
        <p className="stat-value">5</p>
      </div>
    </div>

    <div className="chart-placeholder">
      <p>График активности будет здесь</p>
    </div>
  </div>
);

const UsersSection = ({ 
  members, 
  loading, 
  error,
  onRefresh 
}: {
  members: DiscordGuildMember[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) => {
  return (
    <div className="users-section">
      <div className="section-toolbar">
        <h3>Управление пользователями</h3>
        <button
          className="btn refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Обновление...' : 'Обновить'}
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
          {members.length === 0 ? (
            <div className="empty-state">
              <FiUser size={48} />
              <p>Нет пользователей для отображения</p>
            </div>
          ) : (
            members.map((member) => (
              <MemberCard key={member.user.id} member={member} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const MemberCard = ({ member }: { member: DiscordGuildMember }) => {

  const getAvatarUrl = (userId: string, avatarHash: string | null, discriminator: string) => {
    if (avatarHash) {
      // Используйте ваш сервер как прокси
      return `http://localhost:3001/api/avatar-proxy/${userId}/${avatarHash}`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;
  };

  const displayName = member.nick || member.user.username;
  const joinDate = new Date(member.joined_at).toLocaleDateString();

  return (
    <div className="member-card">
      <div className="member-avatar-container">
      <img
          src={getAvatarUrl(member.user.id, member.user.avatar, member.user.discriminator)}
          alt={`${displayName}'s avatar`}
          className="member-avatar"
          crossOrigin="anonymous" // Добавьте это
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

const SettingsSection = ({ darkMode, toggleDarkMode }: { darkMode: boolean; toggleDarkMode: () => void }) => (
  <div className="settings-section">
    <h3>Настройки панели</h3>

    <div className="setting-item">
      <label>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        Темная тема
      </label>
    </div>

    <div className="setting-item">
      <h4>Уведомления</h4>
      <label>
        <input type="checkbox" defaultChecked />
        Новые жалобы
      </label>
      <label>
        <input type="checkbox" defaultChecked />
        Системные сообщения
      </label>
    </div>
  </div>
);