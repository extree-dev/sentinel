import { useState, useEffect } from 'react';
import { FiSettings, FiActivity, FiShield, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './css/Dashboard.css';

type TabType = 'moderation' | 'analytics' | 'users' | 'settings';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  isAdmin?: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем активную вкладку на основе URL
  const activeTab = location.pathname.split('/').pop() as TabType || 'moderation';

  useEffect(() => {
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
  }, []);

  const handleTabChange = (tab: TabType) => {
    navigate(`/dashboard/${tab}`);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Загрузка панели...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-layout`}>
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const Sidebar = ({ user, activeTab, onTabChange }: {
  user: DiscordUser | null;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
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