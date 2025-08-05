import { Router } from 'express';
import axios from 'axios';
import qs from 'querystring';

const router = Router();
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } = process.env;
const usedCodes = new Set();

router.post('/token', async (req, res) => {
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

// Добавь остальные Discord-роуты
export default router;