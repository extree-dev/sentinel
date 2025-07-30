// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { type DiscordUser, type DiscordRole } from '../types';

const ALLOWED_ROLE_IDS = [
    '1399388382492360908',
    '1376907353525457006',
    '1375122819305832612'
];

const VERIFICATION_ROLE_ID = '1395033667486748832';
const ADMIN_ROLE_ID = '1399388382492360908'; // Главный администратор
const SENIOR_MOD_ROLE_ID = '1376907353525457006'; // Senior Moderator

export const useAuth = () => {
    const [user, setUser] = useState<DiscordUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [isVerifier, setIsVerifier] = useState(false);
    const [isAdminOrSeniorMod, setIsAdminOrSeniorMod] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('discord_access_token');
        console.log('Current token:', token?.slice(0, 10) + '...');

        if (!token) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const userRes = await fetch('http://localhost:3000/api/discord/user-full', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (userRes.ok) {
                    const data = await userRes.json();
                    console.log('Full user data:', data);

                    // Определяем тип для роли
                    type DiscordRole = string | { id: string };

                    // Получаем ID ролей
                    const roles: DiscordRole[] = Array.isArray(data.roles) ? data.roles : [];
                    const roleIds = roles.map((role: DiscordRole) =>
                        typeof role === 'string' ? role : role.id
                    );

                    console.log('User role IDs:', roleIds);

                    const hasRequiredRole = ALLOWED_ROLE_IDS.some(roleId =>
                        roleIds.includes(roleId)
                    );
                    const hasVerifierRole = roleIds.includes(VERIFICATION_ROLE_ID);

                    const normalizedUser: DiscordUser = {
                        id: data.user?.id || data.id,
                        username: data.user?.username || data.username,
                        discriminator: data.user?.discriminator || data.discriminator || '0',
                        avatar: data.user?.avatar || data.avatar || null,
                        roles: data.roles || [],
                        isAdmin: data.isAdmin || false,
                        isModerator: data.isModerator || false,
                        isVerifier: hasVerifierRole,
                        ...(data.user || {}),
                        ...data,
                    };

                    const isAdmin = roleIds.includes(ADMIN_ROLE_ID);
                    const isSeniorMod = roleIds.includes(SENIOR_MOD_ROLE_ID);

                    setIsAdminOrSeniorMod(isAdmin || isSeniorMod);

                    setUser(normalizedUser);
                    setHasAccess(hasRequiredRole);
                    setIsVerifier(hasVerifierRole);

                    console.log('Access check results:', {
                        hasAccess: hasRequiredRole,
                        isVerifier: hasVerifierRole
                    });
                } else {
                    console.error('Failed to fetch user:', await userRes.text());
                    localStorage.removeItem('discord_access_token');
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const logout = () => {
        localStorage.removeItem('discord_access_token');
        setUser(null);
        setHasAccess(false);
        setIsVerifier(false);
        window.location.href = '/';
    };

    return { user, loading, hasAccess, isVerifier, logout, isAdminOrSeniorMod };
};