// src/client/components/layout/Footer.tsx
import React from 'react';
import '../../css/Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Sentinel</h3>
          <p>Мощная панель модерации для Discord</p>
        </div>
        
        <div className="footer-section">
          <h4>Навигация</h4>
          <ul>
            <li><a href="/">Главная</a></li>
            <li><a href="/dashboard">Панель</a></li>
            <li><a href="/login">Войти</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Контакты</h4>
          <ul>
            <li>Email: support@sentinel.com</li>
            <li>Discord: Sentinel#6913</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Sentinel. Все права защищены.</p>
      </div>
    </footer>
  );
};