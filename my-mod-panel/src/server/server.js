const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

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
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        
        // Помечаем код как использованный
        usedCodes.add(code);

        res.json(tokens);
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to exchange token',
            details: error.response?.data || error.message
        });
    }
});

app.get('/api/discord/user', async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  
  if (!accessToken) {
      return res.status(401).json({ error: 'Access token missing' });
  }

  try {
      const response = await axios.get('https://discord.com/api/users/@me', {
          headers: {
              Authorization: `Bearer ${accessToken}`
          }
      });
      
      console.log('User data:', response.data);
      res.json(response.data);
  } catch (error) {
      console.error('Failed to fetch user data:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch user data' });
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
    const guildId = 'YOUR_GUILD_ID';
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/members?limit=1000`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const members = await response.json();
    res.json({ members });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    res.status(500).json({ message: error.message });
  }
});

app.use(cors({
  origin: 'http://localhost:3000', // Адрес фронтенда
  credentials: true
}));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));