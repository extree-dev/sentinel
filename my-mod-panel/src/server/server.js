const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = '1394946498386722866';
const CLIENT_SECRET = 'NbFMlqpF3Ca7I9YL4EpXSX1IyqgvqANW';
const REDIRECT_URI = 'http://localhost:5173/callback';

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    // Обмен code на access_token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
        new URLSearchParams({
            client_id: 'YOUR_CLIENT_ID',
            client_secret: 'YOUR_CLIENT_SECRET',
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:5173/callback'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    
    // Получение данных пользователя
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
    });
    
    // Здесь сохраняем пользователя в БД и возвращаем токен
    res.redirect('/dashboard');
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});