import { FiSettings, FiActivity, FiShield } from 'react-icons/fi';
import { type DiscordUser } from '../types/';

interface SidebarProps {
  user: DiscordUser | null;
  activeTab: 'moderation' | 'analytics' | 'settings';
  onTabChange: (tab: 'moderation' | 'analytics' | 'settings') => void;
}

export const Sidebar = ({ user, activeTab, onTabChange }: SidebarProps) => (
  <aside className="sidebar">
    <div className="logo">ModPanel</div>
    
    <nav>
      <button 
        className={`nav-btn ${activeTab === 'moderation' ? 'active' : ''}`}
        onClick={() => onTabChange('moderation')}
      >
        <FiShield />
        <span>Модерация</span>
      </button>
      
      <button 
        className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => onTabChange('analytics')}
      >
        <FiActivity />
        <span>Аналитика</span>
      </button>
      
      <button 
        className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        <FiSettings />
        <span>Настройки</span>
      </button>
    </nav>
    
    <div className="user-info">
      <img 
        src={user?.avatar 
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
          : '/default-avatar.png'
        } 
        alt="User Avatar"
      />
      <span>{user?.username || 'Модератор'}</span>
    </div>
  </aside>
);