import { useState, useEffect } from 'react';
import { type ModerationCase } from '../types/';

const CaseCard = ({ data }: { data: ModerationCase }) => (
  <div className="case-card">
    <div className="case-header">
      <span className={`case-type ${data.type}`}>{data.type}</span>
      <span className="case-date">{new Date(data.createdAt).toLocaleString()}</span>
    </div>
    <div className="case-user">{data.username}</div>
    <div className="case-reason">{data.reason}</div>
  </div>
);

export const ModerationSection = () => {
  const [activeFilter, setActiveFilter] = useState<'reports' | 'bans' | 'warns'>('reports');
  const [cases, setCases] = useState<ModerationCase[]>([]);

  useEffect(() => {
    // Заглушка с тестовыми данными
    setCases([
      {
        id: '1',
        userId: '111111111',
        username: 'User1',
        type: 'ban',
        reason: 'Нарушение правил чата',
        createdAt: '2023-05-01T10:00:00Z'
      },
      {
        id: '2',
        userId: '222222222',
        username: 'User2',
        type: 'warn',
        reason: 'Спам',
        createdAt: '2023-05-02T11:30:00Z'
      }
    ]);
  }, [activeFilter]);

  return (
    <div className="moderation-grid">
      <div className="filters">
        <button 
          className={activeFilter === 'reports' ? 'active' : ''}
          onClick={() => setActiveFilter('reports')}
        >
          Жалобы
        </button>
        <button 
          className={activeFilter === 'bans' ? 'active' : ''}
          onClick={() => setActiveFilter('bans')}
        >
          Баны
        </button>
        <button 
          className={activeFilter === 'warns' ? 'active' : ''}
          onClick={() => setActiveFilter('warns')}
        >
          Предупреждения
        </button>
      </div>
      
      <div className="cases-list">
        {cases.length > 0 ? (
          cases.map(caseItem => (
            <CaseCard key={caseItem.id} data={caseItem} />
          ))
        ) : (
          <div className="empty-state">Нет активных случаев</div>
        )}
      </div>
    </div>
  );
};