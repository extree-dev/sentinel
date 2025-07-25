// src/components/CaseCard.tsx
import { useState } from 'react';
import { type ModerationCase, type DiscordUser } from '../types';

export default function CaseCard({ 
  caseData, 
  onApprove, 
  onReject, 
  currentUser 
}: {
  caseData: ModerationCase;
  onApprove: () => void;
  onReject: () => void;
  currentUser: DiscordUser | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`case-card ${caseData.handled ? 'handled' : ''} ${caseData.type}`}>
      <div className="case-header" onClick={() => setExpanded(!expanded)}>
        <div className="case-user-info">
          <img
            src={caseData.avatar
              ? `https://cdn.discordapp.com/avatars/${caseData.userId}/${caseData.avatar}.webp?size=40`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(caseData.discriminator || '0') % 5}.png`
            }
            alt="User Avatar"
            className="case-avatar"
          />
          <span className="case-username">{caseData.username}</span>
          <span className={`case-type ${caseData.type}`}>
            {caseData.type === 'ban' && 'Бан'}
            {caseData.type === 'warn' && 'Предупреждение'}
            {caseData.type === 'mute' && 'Мьют'}
            {caseData.type === 'report' && 'Жалоба'}
          </span>
        </div>

        <div className="case-meta">
          <span className="case-date">
            {new Date(caseData.createdAt).toLocaleString()}
          </span>
          <span className="case-status">
            {caseData.handled ? 'Обработано' : 'В ожидании'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="case-details">
          <div className="case-reason">
            <h4>Причина:</h4>
            <p>{caseData.reason}</p>
          </div>

          {!caseData.handled && currentUser?.isAdmin && (
            <div className="case-actions">
              <button className="btn approve-btn" onClick={onApprove}>
                Подтвердить
              </button>
              <button className="btn reject-btn" onClick={onReject}>
                Отклонить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}