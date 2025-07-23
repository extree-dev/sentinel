const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

// Инициализация Discord клиента
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Конфигурация
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3001;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST']
}));
app.use(cookieParser());
app.use(express.json());

// Хранилище состояний (в продакшене используйте Redis)
const activeStates = new Set();

// Генерация state
const generateState = () => {
  const state = crypto.randomBytes(16).toString('hex');
  activeStates.add(state);
  return state;
};

// Подключение Discord бота
discordClient.login(DISCORD_BOT_TOKEN)
  .then(() => console.log('Discord bot connected'))
  .catch(err => console.error('Failed to connect Discord bot:', err));

// Middleware для проверки аутентификации
const authenticate = async (req, res, next) => {
  try {
    // Проверяем токен из кук ИЛИ из заголовка Authorization
    const token = req.cookies.discord_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Проверяем токен через Discord API
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Authenticated user:', response.data.id);
    req.user = response.data;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).clearCookie('discord_token').json({ 
      error: 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Эндпоинт для получения участников сервера
app.get('/api/guild-members', authenticate, async (req, res) => {
  try {
    console.log('Fetching guild members for user:', req.user.id);
    
    if (!discordClient.isReady()) {
      console.error('Discord client not ready');
      return res.status(503).json({ error: 'Discord client not ready' });
    }

    console.log('Fetching guild...');
    const guild = await discordClient.guilds.fetch(GUILD_ID).catch(err => {
      console.error('Guild fetch error:', err);
      throw err;
    });
    
    console.log(`Fetched guild: ${guild.name}`);
    console.log('Fetching members...');
    
    const members = await guild.members.fetch().catch(err => {
      console.error('Members fetch error:', err);
      throw err;
    });
    
    console.log(`Found ${members.size} members`);
    
    const membersData = Array.from(members.values()).map(member => ({
      user: {
        id: member.user.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
        bot: member.user.bot
      },
      roles: member.roles.cache.map(role => role.id),
      joined_at: member.joinedAt.toISOString(),
      nick: member.nick
    }));
    
    res.json({ members: membersData });
  } catch (error) {
    console.error('Guild members error:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.id
    });
    res.status(500).json({ 
      error: 'Failed to fetch members',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/avatar-proxy/:userId/:avatarHash', async (req, res) => {
  try {
    const { userId, avatarHash } = req.params;
    const size = req.query.size || 80;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=${size}`;
    
    const response = await axios.get(avatarUrl, {
      responseType: 'arraybuffer'
    });
    
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(404).send('Avatar not found');
  }
});

// 1. Инициирование OAuth
app.get('/api/auth/discord', (req, res) => {
  const state = generateState();
  
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60000
  });

  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'none');

  res.redirect(authUrl.toString());
});

// 2. Обработка callback
app.get('/api/auth/discord/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies.oauth_state;

  if (!storedState || !activeStates.has(storedState) || state !== storedState) {
    return res.redirect(`${FRONTEND_URL}/?error=invalid_state`);
  }

  activeStates.delete(storedState);

  if (error) {
    return res.redirect(`${FRONTEND_URL}/?error=auth_failed&reason=${error}`);
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.cookie('discord_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in * 1000
    });

    res.redirect(`${FRONTEND_URL}/auth/success?user=${encodeURIComponent(JSON.stringify(userResponse.data))}`);

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/?error=auth_failed&details=${error.response?.data?.error || 'unknown'}`);
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const discordReady = discordClient.isReady();
    res.json({
      status: 'ok',
      discordReady,
      guildId: GUILD_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Получение данных пользователя
app.get('/api/auth/user', async (req, res) => {
  try {
    const token = req.cookies.discord_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(401).clearCookie('discord_token').json({ error: 'Invalid token' });
  }
});

// 4. Выход
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('discord_token');
  res.json({ success: true });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

app.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`);
  console.log(`OAuth2 configured for client: ${CLIENT_ID}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});