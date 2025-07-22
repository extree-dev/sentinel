import { Link } from 'react-router-dom';
import './css/CookiePolicy.css';

export default function CookiePolicy() {
  return (
    <div className="cookie-policy-page">

      <div className="cookie-main-content">
        <article className="cookie-policy-card">
          <h1 className="cookie-policy-heading">Политика использования cookie-файлов</h1>
          
          {/* Раздел 1 */}
          <section className="cookie-policy-block">
            <h2 className="cookie-section-heading">1. Что такое cookie?</h2>
            <p className="cookie-text-paragraph">
              Cookie – это небольшой файл данных, который тот или иной сайт просит ваш браузер сохранить на
              компьютере или мобильном устройстве.
            </p>
            <p className="cookie-text-paragraph">
              В рамках этого сайта используются два главных вида файлов Cookie:
            </p>
            <ul className="cookie-items-list">
              <li className="cookie-list-item">
                <strong>Сессионные (session cookies)</strong> – файлы, ограниченные по времени, которые
                сохраняются на ПК пользователя до момента его выхода с сайта.
              </li>
              <li className="cookie-list-item">
                <strong>Постоянные (persistent cookies)</strong> – файлы, которые сохраняются на ПК
                пользователя определенный период времени.
              </li>
            </ul>
          </section>

          {/* Раздел 2 */}
          <section className="cookie-policy-block">
            <h2 className="cookie-section-heading">2. Для чего используются файлы cookie</h2>
            <p className="cookie-text-paragraph">
              Мы используем cookie-файлы с целью обеспечения максимального удобства:
            </p>
            <ul className="cookie-items-list">
              <li className="cookie-list-item">Запоминание предыдущих посещений</li>
              <li className="cookie-list-item">Сохранение предпочитаемых настроек</li>
              <li className="cookie-list-item">Персонализация контента</li>
            </ul>
          </section>

          {/* Раздел 3 */}
          <section className="cookie-policy-block">
            <h2 className="cookie-section-heading">3. Типы файлов cookie</h2>

            <h3 className="cookie-subsection-title">3.1. Строго необходимые файлы cookie</h3>
            <ul className="cookie-items-list">
              <li className="cookie-list-item">Доступ в безопасные зоны</li>
              <li className="cookie-list-item">Регистрация аккаунта</li>
            </ul>

            <h3 className="cookie-subsection-title">3.2. Функциональные файлы cookie</h3>
            <ul className="cookie-items-list">
              <li className="cookie-list-item">Языковые настройки</li>
              <li className="cookie-list-item">Временная зона</li>
            </ul>
          </section>

          {/* Раздел 4 */}
          <section className="cookie-policy-block">
            <h2 className="cookie-section-heading">4. Управление cookie</h2>
            <div className="cookie-table-wrapper">
              <table className="cookie-browsers-table">
                <thead>
                  <tr className="cookie-table-row">
                    <th className="cookie-table-header">Браузер</th>
                    <th className="cookie-table-header">Инструкция</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cookie-table-row">
                    <td className="cookie-table-data">Google Chrome</td>
                    <td className="cookie-table-data">
                      <a href="https://support.google.com/chrome/answer/95647" 
                         className="cookie-external-link"
                         target="_blank" 
                         rel="noopener noreferrer">
                        Управление cookie
                      </a>
                    </td>
                  </tr>
                  <tr className="cookie-table-row">
                    <td className="cookie-table-data">Firefox</td>
                    <td className="cookie-table-data">
                      <a href="https://support.mozilla.org/kb/delete-cookies" 
                         className="cookie-external-link"
                         target="_blank" 
                         rel="noopener noreferrer">
                        Управление cookie
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Раздел 5 */}
          <section className="cookie-policy-block">
            <h2 className="cookie-section-heading">5. Изменения в политике</h2>
            <p className="cookie-text-paragraph">
              Дата последнего обновления: <strong>18 июля 2025 года</strong>.
            </p>
          </section>

          <div className="cookie-footer-actions">
            <Link to="/" className="back-btn">
              Вернуться на главную
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}