// src/components/ModerationSection.tsx
import { useState, useEffect } from 'react';
import { type ModerationCase, type CaseType, type DiscordUser } from '../types';
import CaseCard from '../components/CaseCard';

export default function ModerationSection() {
  const [activeFilter, setActiveFilter] = useState<CaseType | 'all'>('all');
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [user] = useState<DiscordUser | null>({
    id: '123456789',
    username: 'AdminModer',
    discriminator: '0001',
    avatar: 'a1b2c3d4e5',
    isAdmin: true
  });

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

  const handleCaseAction = (caseId: string) => {
    setCases(cases.map(c =>
      c.id === caseId ? { ...c, handled: true } : c
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
            <p>Нет случаев для отображения</p>
          </div>
        ) : (
          filteredCases.map(caseItem => (
            <CaseCard
              key={caseItem.id}
              caseData={caseItem}
              onApprove={() => handleCaseAction(caseItem.id)}
              onReject={() => handleCaseAction(caseItem.id)}
              currentUser={user}
            />
          ))
        )}
      </div>
    </div>
  );
}