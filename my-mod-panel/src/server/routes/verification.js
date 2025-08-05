import { Router } from 'express';
import { query } from '../lib/db.js';
import { client } from '../lib/discordClient.js';

const router = Router();
const VERIFICATION_LOG_CHANNEL_ID = '1395295093120041114';

router.post('/request', async (req, res) => {
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

router.get('/requests', async (req, res) => {
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

router.post('/approve/:id', async (req, res) => {
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

router.post('/reject/:id', async (req, res) => {
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

export default router;