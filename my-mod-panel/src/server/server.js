import express from 'express';
import axios from 'axios'; // Заменил require на import
import qs from 'querystring';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Для замены __dirname
import dotenv from 'dotenv';
import client from '../../../discordClient'

// Создаем аналог __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка .env ДО создания приложения
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = process.env;

// Хранилище использованных кодов (временное, для разработки)
const usedCodes = new Set();

app.post('/api/verification/request', async (req, res) => {
    try {
        const { discordTag, userId, username, avatar } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Проверяем токен
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (userRes.data.id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Сохраняем запрос в базе (заглушка)
        const requestId = `req_${Date.now()}`;
        const newRequest = {
            id: requestId,
            discordTag,
            userId,
            username,
            avatar,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Отправляем уведомление в Discord
        const channelId = '1395295093120041114';
        const channel = client.channels.cache.get(channelId);
        
        if (channel) {
            await channel.send({
                embeds: [{
                    title: '📄 Новый запрос на верификацию',
                    description: `**Пользователь:** ${username} (${discordTag})\n**ID:** ${userId}`,
                    color: 0x5865F2,
                    thumbnail: {
                        url: avatar 
                            ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.webp?size=256`
                            : `https://cdn.discordapp.com/embed/avatars/0.png`
                    },
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `ID запроса: ${requestId}`
                    }
                }]
            });
        }

        res.status(201).json({ 
            success: true,
            requestId 
        });
    } catch (error) {
        console.error('Error processing verification request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/verification/requests', async (req, res) => {
    try {
        // В реальности здесь запрос к базе данных
        const mockRequests = [
            {
                id: 'req_1',
                discordTag: 'test_user',
                status: 'pending',
                createdAt: new Date().toISOString(),
                user: {
                    id: '123',
                    username: 'Test User',
                    avatar: null
                }
            }
        ];
        
        res.json({ requests: mockRequests });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/verification/approve/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const channelId = '1395295093120041114';
        const channel = client.channels.cache.get(channelId);
        
        if (channel) {
            await channel.send({
                embeds: [{
                    title: '✅ Запрос на верификацию одобрен',
                    description: `Запрос ${requestId} был одобрен модератором`,
                    color: 0x57F287,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/verification/reject/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const channelId = '1395295093120041114';
        const channel = client.channels.cache.get(channelId);
        
        if (channel) {
            await channel.send({
                embeds: [{
                    title: '❌ Запрос на верификацию отклонен',
                    description: `Запрос ${requestId} был отклонен модератором`,
                    color: 0xED4245,
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/discord/token', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing' });
    }

    // Проверяем, не использовался ли код ранее
    if (usedCodes.has(code)) {
        console.log(`Code ${code} already used`);
        return res.status(400).json({ error: 'Authorization code already used' });
    }

    const data = {
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: 'identify email'
    };

    try {
        console.log("Exchanging code for token...");

        const response = await axios.post(
            'https://discord.com/api/oauth2/token',
            qs.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const tokens = response.data;
        console.log('Successfully received tokens:');
        console.log('Access Token:', tokens.access_token?.slice(0, 5) + '...'); // Не логируйте полный токен!
        console.log('Refresh Token:', tokens.refresh_token?.slice(0, 5) + '...');

        usedCodes.add(code);

        res.json({
            ...tokens,
            // Добавляем флаг, что токен нужно сохранить
            _saveToLocalStorage: true
        });
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to exchange token',
            details: error.response?.data || error.message
        });
    }
});

app.get('/api/discord/user', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Token required' });
    }
  
    try {
      // Только основные данные пользователя
      const userRes = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.json(userRes.data);
      
    } catch (error) {
      console.error('Discord API error:', error.response?.status);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

app.post('/api/discord/refresh', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is missing' });
    }

    const data = {
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    };

    try {
        const response = await axios.post(
            'https://discord.com/api/oauth2/token',
            qs.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const tokens = response.data;
        res.json(tokens);
    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to refresh token',
            details: error.response?.data || error.message
        });
    }
});

app.get('/api/discord/guilds', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];

    try {
        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Failed to fetch guilds:', error);
        res.status(500).json({ error: 'Failed to fetch guilds' });
    }
});

app.get('/api/discord/connections', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];

    try {
        const response = await axios.get('https://discord.com/api/users/@me/connections', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Failed to fetch connections:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

app.get('/api/guild-roles', async (req, res) => {
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

app.get('/api/guild-members', async (req, res) => {
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

app.get('/api/discord/user', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        return res.status(401).json({ error: 'Access token missing' });
    }

    try {
        // Получаем данные пользователя из Discord
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // Получаем данные о членстве в гильдии
        const memberResponse = await axios.get(
            `https://discord.com/api/guilds/${GUILD_ID}/members/${userResponse.data.id}`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`
                }
            }
        );

        // Определяем роли
        const isAdmin = memberResponse.data.roles.includes(process.env.ADMIN_ROLE_ID);
        const isModerator = isAdmin || memberResponse.data.roles.includes(process.env.MODERATOR_ROLE_ID);

        res.json({
            ...userResponse.data,
            ...memberResponse.data,
            isAdmin,
            isModerator
        });
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.get('/api/discord/user-full', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        // 1. Получаем основные данные пользователя
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Получаем данные о членстве в гильдии
        const memberRes = await axios.get(
            `https://discord.com/api/guilds/${GUILD_ID}/members/${userRes.data.id}`,
            {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            }
        );

        // 3. Получаем роли сервера
        const rolesRes = await axios.get(
            `https://discord.com/api/guilds/${GUILD_ID}/roles`,
            {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            }
        );

        // 4. Формируем полные данные о ролях пользователя
        const userRoles = memberRes.data.roles.map(roleId => {
            const role = rolesRes.data.find(r => r.id === roleId);
            return role ? {
                id: role.id,
                name: role.name,
                color: role.color,
                position: role.position
            } : null;
        }).filter(Boolean);

        res.json({
            ...userRes.data,
            ...memberRes.data,
            roles: userRoles,
            isAdmin: memberRes.data.roles.includes(process.env.ADMIN_ROLE_ID),
            isModerator: memberRes.data.roles.includes(process.env.MODERATOR_ROLE_ID)
        });
    } catch (error) {
        console.error('Error fetching full user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.get('/api/discord/guilds/:guildId/members/@me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { guildId } = req.params;

    try {
        const response = await axios.get(
            `https://discord.com/api/guilds/${guildId}/members/@me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guild member data' });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));