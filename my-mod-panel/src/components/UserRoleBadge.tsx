import { type DiscordUser } from '../types';

const ROLE_IDS = {
  MAIN_ADMIN: '1399388382492360908',
  SENIOR_MOD: '1376907353525457006',
  MODERATOR: '1375122819305832612'
};

export const UserRoleBadge = ({ user }: { user: DiscordUser }) => {
  if (!user.roles) return null;

  const getMainRole = () => {
    if (user.roles.includes(ROLE_IDS.MAIN_ADMIN)) {
      return { text: 'Главный Администратор', className: 'main-admin' };
    }
    if (user.roles.includes(ROLE_IDS.SENIOR_MOD)) {
      return { text: 'Senior Moderator', className: 'senior-mod' };
    }
    if (user.roles.includes(ROLE_IDS.MODERATOR)) {
      return { text: 'Moderator', className: 'moderator' };
    }
    return null;
  };

  const role = getMainRole();
  if (!role) return null;

  return <span className={`role-badge ${role.className}`}>{role.text}</span>;
};