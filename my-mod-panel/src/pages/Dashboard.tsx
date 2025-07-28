import { useState, useEffect } from 'react';
import { FiSettings, FiActivity, FiShield, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './css/Dashboard.css';
import type { DiscordUser } from '../types'; // Используем type-only import
import { useAuth } from '../hooks/useAuth';
import { UserRoleBadge } from '../components/UserRoleBadge';

type TabType = 'moderation' | 'analytics' | 'users' | 'settings';


export default function Dashboard() {
  const { user, loading } = useAuth(); // Данные теперь берутся из хука
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем активную вкладку на основе URL
  const activeTab = location.pathname.split('/').pop() as TabType || 'moderation';


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
      {user ? (
        <div className="user-card-sidebar">
          <img
            src={user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=256`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`
            }
            alt="User Avatar"
            className="user-avatar"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
            }}
          />
          <div className="user-info">
            <span className="username">{user.username}</span>
            <span className="user-tag">#{user.discriminator}</span>
            <UserRoleBadge user={user} />
            {/* Безопасная проверка опциональных свойств */}
            {'isModerator' in user && user.isModerator && (
              <span className="moderator-badge">Модератор</span>
            )}
            {'isAdmin' in user && user.isAdmin && (
              <span className="admin-badge">Админ</span>
            )}
          </div>
        </div>
      ) : (
        <div className="user-card-sidebar unauthorized">
          <div className="user-info">
            <span className="username">Не авторизован</span>
          </div>
        </div>
      )}
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