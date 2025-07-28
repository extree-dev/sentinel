import express from 'express';
import axios from 'axios'; // Заменил require на import
import qs from 'querystring';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Для замены __dirname
import dotenv from 'dotenv';

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

app.get('/api/guild-members', async (req, res) => {
    try {
        const response = await axios.get(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
            {
                headers: { Authorization: `Bot ${BOT_TOKEN}` }
            }
        );

        res.json({ members: response.data });
    } catch (error) {
        console.error('Discord API error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch Discord members' });
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