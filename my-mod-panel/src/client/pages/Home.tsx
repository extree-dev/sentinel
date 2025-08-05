import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaShieldAlt, FaChartLine, FaRobot, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../css/Home.css';

export const Home = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Advanced Moderation",
      description: "AI-powered protection with customizable rules"
    },
    {
      icon: <FaChartLine />,
      title: "Real-time Analytics",
      description: "Detailed insights with predictive analytics"
    },
    {
      icon: <FaRobot />,
      title: "Automation Suite",
      description: "Smart workflows to reduce manual work"
    }
  ];

  return (
    <div className="home-container">
      {/* Gradient background with mouse parallax effect */}
      <div className="background-gradient" style={{
        transform: `translate(
          ${-mousePosition.x * 0.02}px, 
          ${-mousePosition.y * 0.02}px
        )`
      }}></div>

      {/* Main Content */}
      <motion.div 
        className="hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.div 
            className="logo-wrapper"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <FaDiscord className="main-logo" />
            <div className="logo-text">
              <span className="logo-primary">SENTINEL</span>
              <span className="logo-sub">MOD PANEL</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hero-title"
          >
            Next Generation <span className="gradient-text">Discord</span> Moderation
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="hero-subtitle"
          >
            AI-powered tools with 2025's most advanced server management platform
          </motion.p>

          {/* Центральная кнопка входа - ОСНОВНОЙ ФОКУС */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="cta-container"
          >
            <button 
              className={`login-button ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => navigate('/dashboard')}
            >
              <span>Enter Dashboard</span>
              <motion.div 
                className="button-arrow"
                animate={{ x: isHovered ? 8 : 0 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <FaArrowRight />
              </motion.div>
              <div className="button-shine"></div>
            </button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="feature-showcase">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="feature-card"
            >
              <div className="feature-icon">{features[activeFeature].icon}</div>
              <h3>{features[activeFeature].title}</h3>
              <p>{features[activeFeature].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};