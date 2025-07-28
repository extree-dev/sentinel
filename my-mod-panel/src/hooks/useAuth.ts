// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { type DiscordUser } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<DiscordUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('discord_access_token');
        console.log('Current token:', token?.slice(0, 10) + '...');

        if (!token) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Только основные данные пользователя
                const userRes = await fetch('http://localhost:3000/api/discord/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    console.log('User data received:', userData);
                    setUser(userData);
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

    return { user, loading };
};