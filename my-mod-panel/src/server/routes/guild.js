import { Router } from 'express';
import axios from 'axios';

const router = Router();
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get('/roles', async (req, res) => {
    try {
        const response = await axios.get(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
            {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            }
        );

        // Фильтруем роли (убираем @everyone и сортируем по позиции)
        const roles = response.data
            .filter(role => role.id !== GUILD_ID) // Убираем @everyone
            .sort((a, b) => b.position - a.position); // Сортируем по позиции

        res.json({ roles });
    } catch (error) {
        console.error('Discord API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch Discord roles' });
    }
});

router.get('/members', async (req, res) => {
    console.log('Starting /api/guild-members request');

    try {
        // 1. Получаем участников сервера
        console.log('Fetching members from Discord API...');
        const membersResponse = await axios.get(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Received ${membersResponse.data.length} members`);

        // 2. Получаем роли сервера
        console.log('Fetching roles from Discord API...');
        const rolesResponse = await axios.get(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Received ${rolesResponse.data.length} roles`);

        // 3. Фильтруем и сортируем роли
        const filteredRoles = rolesResponse.data
            .filter(role => role.id !== GUILD_ID) // Убираем @everyone
            .sort((a, b) => b.position - a.position);
        console.log(`Filtered to ${filteredRoles.length} roles`);

        // 4. Создаем карту ролей
        const rolesMapping = new Map();
        filteredRoles.forEach(role => {
            rolesMapping.set(role.id, {
                name: role.name,
                color: role.color,
                position: role.position // Добавляем позицию для сортировки
            });
        });
        console.log('Roles mapping:', Array.from(rolesMapping.entries()));

        // 5. Обрабатываем участников
        const membersData = membersResponse.data.map(member => {
            const userRoles = member.roles
                .map(roleId => ({
                    id: roleId,
                    name: rolesMapping.get(roleId)?.name || `Role-${roleId}`,
                    color: rolesMapping.get(roleId)?.color,
                    position: rolesMapping.get(roleId)?.position || 0
                }))
                .sort((a, b) => b.position - a.position); // Сортировка по убыванию позиции

            return {
                id: member.user.id,
                username: member.user.global_name || member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.avatar,
                roles: userRoles, // Уже отсортированные роли
                joined_at: member.joined_at,
                is_bot: member.user.bot || false
            };
        });

        console.log('Processed members count:', membersData.length);
        if (membersData.length > 0) {
            console.log('Sample member data:', {
                id: membersData[0].id,
                username: membersData[0].username,
                roles: membersData[0].roles
            });
        }

        // 6. Отправляем ответ
        res.json({
            success: true,
            count: membersData.length,
            members: membersData
        });

    } catch (error) {
        console.error('!!! API ERROR !!!');
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            details: {
                message: error.message,
                ...(error.response && {
                    status: error.response.status,
                    data: error.response.data
                })
            }
        });
    }
});

export default router;