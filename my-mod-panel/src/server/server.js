require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { connect } = require('./database/db');
const fs = require('fs');
const logger = require('./utils/logger');
const cors = require('cors');

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// OAuth эндпоинты
app.post('/api/auth/discord', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Обмен кода на токен
    const params = new URLSearchParams();
    params.append('client_id', process.env.DISCORD_CLIENT_ID);
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.DISCORD_REDIRECT_URI);
    params.append('scope', 'identify email');

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Получаем данные пользователя
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`
      }
    });

    // Здесь можно сохранить пользователя в БД
    // и сгенерировать JWT токен

    res.json({
      token: 'your_generated_jwt_token',
      user: userResponse.data
    });

  } catch (error) {
    logger.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Запуск веб-сервера и бота
const start = async () => {
  try {
    await connect();
    
    // Запуск Express сервера
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.log(`Server running on http://localhost:${PORT}`);
    });

    // Запуск Discord бота
    await client.login(process.env.DISCORD_TOKEN);
    logger.log('Discord bot logged in');

    // Запуск фронтенда (если нужно)
    if (process.env.NODE_ENV === 'development') {
      const { spawn } = require('child_process');
      const frontend = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..', 'my-mod-panel'),
        stdio: 'inherit',
        shell: true
      });
    }

  } catch (error) {
    logger.error('Startup error:', error);
    process.exit(1);
  }
};

start();

// Обработчики событий Discord
client.on('ready', () => {
  logger.log(`Logged in as ${client.user.tag}`);
});

process.on('SIGINT', () => {
  logger.log('Shutting down...');
  client.destroy();
  process.exit(0);
});