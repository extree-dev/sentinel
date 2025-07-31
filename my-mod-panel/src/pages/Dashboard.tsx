import { useState, useEffect } from 'react';
import { FiSettings, FiActivity, FiShield, FiUser, FiAlertTriangle, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './css/Dashboard.css';
import type { DiscordUser } from '../types'; // Используем type-only import
import { useAuth } from '../hooks/useAuth';
import { UserRoleBadge } from '../components/UserRoleBadge';

type TabType = 'moderation' | 'analytics' | 'users' | 'settings' | 'verification-requests';


export default function Dashboard() {
  const { user, loading, logout, isAdminOrSeniorMod } = useAuth(); // Данные теперь берутся из хука
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
        onLogout={logout} // Передаем logout в Sidebar
        isAdminOrSeniorMod={isAdminOrSeniorMod} // Передаем новое свойство
      />

      <main className="main-content">
        <div className="content-header">
          <h2 className="header-title">
            {activeTab === 'moderation' && (
              <span className="tab-title">
                <FiShield className="tab-icon" /> Модерация
              </span>
            )}
            {activeTab === 'analytics' && (
              <span className="tab-title">
                <FiActivity className="tab-icon" /> Аналитика
              </span>
            )}
            {activeTab === 'users' && (
              <span className="tab-title">
                <FiUser className="tab-icon" /> Пользователи
              </span>
            )}
            {activeTab === 'verification-requests' && (
              <span className="tab-title">
                <FiCheckCircle className="tab-icon" /> Запросы на верификацию
              </span>
            )}
            {activeTab === 'settings' && (
              <span className="tab-title">
                <FiSettings className="tab-icon" /> Настройки
              </span>
            )}
          </h2>

          <div className="header-actions">
            <button className="notification-btn">
              <FiAlertTriangle className="notification-icon" />
              <span className="notification-badge pulse">3</span>
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

const Sidebar = ({ user, activeTab, onTabChange, onLogout, isAdminOrSeniorMod }: {
  user: DiscordUser | null;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  isAdminOrSeniorMod: boolean;
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
      {/* Добавляем новую кнопку только для админов и старших модераторов */}
      {isAdminOrSeniorMod && (
      <NavButton
        icon={<FiCheckCircle />}
        active={activeTab === 'verification-requests'}
        onClick={() => onTabChange('verification-requests')}
      >
        <span className="nav-text-wrapper">Запросы на верификацию</span>
      </NavButton>
    )}
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
          <div className="user-profile">
            <img
              src={
                user?.user?.avatar
                  ? `https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}.webp?size=256`
                  : user?.avatar
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=256`
                    : `https://cdn.discordapp.com/embed/avatars/${user?.discriminator && user.discriminator !== "0"
                      ? parseInt(user.discriminator) % 5
                      : 0
                    }.png`
              }
              alt="User Avatar"
              className="user-avatar"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget;
                target.src = `https://cdn.discordapp.com/embed/avatars/${user?.discriminator && user.discriminator !== "0"
                  ? parseInt(user.discriminator) % 5
                  : 0
                  }.png`;
              }}
            />
            <div className="user-info">
              <span className="username">{user.username}</span>
              {user.discriminator !== '0' && (
                <span className="user-tag">#{user.discriminator}</span>
              )}
              {user.roles && <UserRoleBadge user={user} />}
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={onLogout} // Используем переданный onLogout
          >
            <FiLogOut className="logout-icon" />
            <span>Выйти</span>
          </button>
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