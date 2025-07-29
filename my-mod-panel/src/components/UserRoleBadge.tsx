import { type DiscordUser } from '../types';

type UserRoleBadgeProps = {
    user: DiscordUser;
};

export const UserRoleBadge = ({ user }: UserRoleBadgeProps) => {
    if (!user?.roles || user.roles.length === 0) return null;
    
    const highestRole = [...user.roles]
        .sort((a, b) => (b.position || 0) - (a.position || 0))[0];
    
    return (
        <span 
            className="highest-role-badge"
            style={{
                backgroundColor: highestRole.color 
                    ? `#${highestRole.color.toString(16).padStart(6, '0')}`
                    : '#5865F2'
            }}
        >
            {highestRole.name}
        </span>
    );
};