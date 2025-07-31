import express from 'express';
import axios from 'axios'; // Заменил require на import
import qs from 'querystring';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Для замены __dirname
import dotenv from 'dotenv';
import { getClient } from '../../../discordClient.mjs';
import { Pool } from 'pg';
const client = getClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const VERIFICATION_LOG_CHANNEL_ID = '1395295093120041114'

client.on('ready', () => {
    console.log(`Discord client ready! Logged in as ${client.user.tag}`);
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});


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
const usedCodes = new Set();

async function query(text, params) {
    try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error('Error executing query', err);
        throw err;
    }
}

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

        // Проверяем, есть ли уже активный запрос от этого пользователя
        const existingRequest = await query(
            'SELECT * FROM verification_requests WHERE user_id = $1 AND status = $2',
            [userId, 'pending']
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({
                error: 'У вас уже есть активный запрос на верификацию'
            });
        }

        // Создаем новый запрос в базе данных
        const requestId = `req_${Date.now()}`;

        const userData = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('FULL USER DATA FROM DISCORD:', {
            id: userData.data.id,
            username: userData.data.username,
            avatar: userData.data.avatar,  // Это главное поле!
            discriminator: userData.data.discriminator,
            global_name: userData.data.global_name
        });

        const getAvatarUrl = (userId, avatarHash, discriminator) => {
            if (!avatarHash) {
                // Для новых пользователей Discord (без discriminator)
                const defaultIndex = discriminator === '0'
                    ? parseInt(userId) % 5
                    : parseInt(discriminator) % 5;
                return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
            }
            return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'webp'}?size=256`;
        };

        const avatarUrl = getAvatarUrl(
            userRes.data.id,
            userRes.data.avatar,  // Используем данные из Discord API
            userRes.data.discriminator
        );

        console.log('Avatar data:', {
            avatar: avatar,
            userId: userId,
            avatarUrl: avatarUrl,
            fullUrl: `https://cdn.discordapp.com/avatars/${userId}/${avatar}.webp`
        });


        await query(
            `INSERT INTO verification_requests 
            (id, discord_tag, user_id, username, avatar, avatar_url, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [requestId, discordTag, userId, username, avatar, avatarUrl, 'pending']
        );

        if (!client.isReady()) {
            return res.status(503).json({ error: 'Discord client is not ready yet' });
        }

        // Отправляем уведомление в Discord
        const channel = client.channels.cache.get(VERIFICATION_LOG_CHANNEL_ID);
        if (!channel) {
            return res.status(500).json({ error: 'Discord channel not found' });
        }

        await channel.send({
            embeds: [{
                title: 'Новый запрос на верификацию',
                description: [
                    `**Пользователь:** <@${userId}>`,
                    `**Discord:** ${discordTag}`,
                    `**ID пользователя:** \`${userId}\``,
                    `**Время запроса:** <t:${Math.floor(Date.now() / 1000)}:F>`
                ].join('\n'),
                color: 0x3e3e5a,
                fields: [
                    {
                        name: 'Статус',
                        value: '\`Ожидает проверки модератором\`'
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: `ID запроса: ${requestId} | ${discordTag}`
                }
            }]
        });

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
        const { status, user_id } = req.query;

        let queryText = 'SELECT * FROM verification_requests';
        const queryParams = [];

        if (status && user_id) {
            queryText += ' WHERE status = $1 AND user_id = $2 ORDER BY created_at DESC';
            queryParams.push(status, user_id);
        } else if (status) {
            queryText += ' WHERE status = $1 ORDER BY created_at DESC';
            queryParams.push(status);
        } else if (user_id) {
            queryText += ' WHERE user_id = $1 ORDER BY created_at DESC';
            queryParams.push(user_id);
        } else {
            queryText += ' ORDER BY created_at DESC';
        }

        const result = await query(queryText, queryParams);

        const requests = result.rows.map(row => ({
            id: row.id,
            discordTag: row.discord_tag,
            status: row.status,
            createdAt: row.created_at,
            user: {
                id: row.user_id,
                username: row.username,
                avatar: row.avatar,
                avatarUrl: row.avatar_url, // Добавляем полный URL
                discriminator: row.discriminator || '0'
            },
            moderatorId: row.moderator_id,
            moderatorComment: row.moderator_comment,
            updatedAt: row.updated_at
        }));

        res.json({ requests });
    } catch (error) {
        console.error('Error fetching verification requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/api/verification/approve/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { moderatorId, comment } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Обновляем запрос в базе данных
        const result = await query(
            `UPDATE verification_requests 
             SET status = 'approved', 
                 moderator_id = $1, 
                 moderator_comment = $2, 
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [moderatorId, comment, requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = result.rows[0];

        // Отправляем уведомление в Discord
        const channel = client.channels.cache.get(VERIFICATION_LOG_CHANNEL_ID);
        if (channel) {
            await channel.send({
                embeds: [{
                    title: 'Запрос на верификацию одобрен',
                    description: [
                        `**Пользователь:** <@${request.user_id}>`,
                        `**Discord:** ${request.discord_tag}`,
                        `**Модератор:** <@${moderatorId}>`,
                        comment && `**Комментарий:** ${comment}`
                    ].filter(Boolean).join('\n'),
                    color: 0x57F287,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `ID запроса: ${requestId}`
                    }
                }]
            });
        }

        res.json({
            success: true,
            request: {
                id: request.id,
                status: request.status,
                updatedAt: request.updated_at
            }
        });
    } catch (error) {
        console.error('Error approving verification request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/verification/reject/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { moderatorId, comment } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Обновляем запрос в базе данных
        const result = await query(
            `UPDATE verification_requests 
             SET status = 'rejected', 
                 moderator_id = $1, 
                 moderator_comment = $2, 
                 updated_at = NOW() 
             WHERE id = $3 
             RETURNING *`,
            [moderatorId, comment, requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = result.rows[0];

        // Отправляем уведомление в Discord
        const channel = client.channels.cache.get(VERIFICATION_LOG_CHANNEL_ID);
        if (channel) {
            await channel.send({
                embeds: [{
                    title: 'Запрос на верификацию отклонен',
                    description: [
                        `**Пользователь:** <@${request.user_id}>`,
                        `**Discord:** ${request.discord_tag}`,
                        `**Модератор:** <@${moderatorId}>`,
                        comment && `**Причина:** ${comment}`
                    ].filter(Boolean).join('\n'),
                    color: 0xED4245,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `ID запроса: ${requestId}`
                    }
                }]
            });
        }

        res.json({
            success: true,
            request: {
                id: request.id,
                status: request.status,
                updatedAt: request.updated_at
            }
        });
    } catch (error) {
        console.error('Error rejecting verification request:', error);
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
        refresh_token: refresh_token,
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: 'identify email guilds',
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