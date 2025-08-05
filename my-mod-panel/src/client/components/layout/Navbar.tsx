import '../../css/Navbar.css'
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDiscord, FaSearch, FaUserCircle, FaMoon, FaSun, FaBell, FaCog } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';

export const Header = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/servers', label: 'Servers' },
        { path: '/moderation', label: 'Moderation' },
        { path: '/analytics', label: 'Analytics' }
    ];

    return (
        <header className={`navbar ${darkMode ? 'dark' : 'light'}`}>
            <div className="navbar-container">
                {/* Logo Section */}
                <div className="navbar-brand">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon">
                            <FaDiscord />
                        </div>
                        <div className="logo-text">
                            <span className="logo-primary">Sentinel</span>
                            <span className="logo-secondary">MOD PANEL</span>
                        </div>
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="navbar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.label}
                            <span className="nav-indicator"></span>
                        </Link>
                    ))}
                </nav>

                {/* Search Bar */}
                <div className="navbar-search">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search servers, users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* User Controls */}
                <div className="navbar-controls">
                    <button 
                        className="control-btn theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label="Toggle theme"
                    >
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </button>

                    <button className="control-btn notification-btn">
                        <FaBell />
                        <span className="notification-badge">3</span>
                    </button>

                    <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                        <div className="user-avatar">
                            <FaUserCircle />
                        </div>
                        <span className="user-name">Admin</span>
                        <IoMdArrowDropdown className={`dropdown-icon ${userMenuOpen ? 'open' : ''}`} />
                        
                        {userMenuOpen && (
                            <div className="user-dropdown">
                                <div className="dropdown-header">
                                    <div className="dropdown-avatar">
                                        <FaUserCircle />
                                    </div>
                                    <div className="dropdown-user-info">
                                        <span className="user-name">Admin User</span>
                                        <span className="user-email">admin@example.com</span>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <Link to="/profile" className="dropdown-item">
                                    <FaUserCircle className="dropdown-icon" />
                                    My Profile
                                </Link>
                                <Link to="/settings" className="dropdown-item">
                                    <FaCog className="dropdown-icon" />
                                    Settings
                                </Link>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item logout">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};