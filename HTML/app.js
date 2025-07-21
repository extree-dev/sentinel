const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '../.env'),
    override: true,
    debug: true
});

const { getClient } = require('../discordClient');
const client = getClient();

const { pool,
    getWarningsFromDatabase,
    removeWarningFromDatabase } = require('./public/js/database');
const { Sequelize, DataTypes } = require('sequelize');
//const { VerificationRequest } = require('../models/verificationRequest')
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Веб-сервер запущен на http://localhost:${PORT}`);
});

// Добавляем обработку завершения
process.on('SIGINT', () => {
    console.log('Завершение веб-сервера');
    process.exit(0);
});

// Инициализация Sequelize (если ещё не сделано)
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const VerificationRequest = require('../models/verificationRequest')(sequelize, DataTypes);

// Проверка подключения к БД и синхронизация моделей
(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(); // или { alter: true } для безопасного обновления таблиц
        console.log('Database connection established and models synced');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
})();

pool.query('SELECT NOW()')
    .then(() => console.log('Database connection established'))
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

console.log('Env check:', {
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: Boolean(process.env.DISCORD_CLIENT_SECRET),
    callbackURL: process.env.DISCORD_CALLBACK_URL
});

if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('DISCORD_CLIENT_ID is required in .env file');
}

// Настройка Passport.js
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds', 'email'],
    prompt: 'consent',
    passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
    console.log('Authenticated:', profile.username);
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Настройка Express
app.set('views', path.join(__dirname, 'views')); // Указываем явный путь
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // И для статики тоже
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true, // Измените на true
    saveUninitialized: false,
    cookie: { secure: false } // Для разработки
}));
app.use(passport.initialize());
app.use(passport.session());

// Маршруты
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.render('login');
    }
});

app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/',
    successRedirect: '/dashboard'
}));

app.get('/dashboard', checkAuth, async (req, res) => {
    try {
        console.log('User roles:', req.user.roles); // Добавьте эту строку

        const guildId = process.env.DISCORD_GUILD_ID;
        const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/members/${req.user.id}`, {
            headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
        });

        const member = response.data;
        console.log('Member data:', member); // Логируем данные участника

        if (!member.roles.includes(process.env.ADMIN_ROLE_ID)) {
            console.log('User is not admin');
            return res.redirect('/logout');
        }

        const warnings = await getWarningsFromDatabase();
        res.render('dashboard', { user: req.user, warnings });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/logout');
    }
});

app.get('/remove-warning/:id', checkAuth, async (req, res) => {
    try {
        await removeWarningFromDatabase(req.params.id);
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.redirect('/dashboard');
    }
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.get('/privacy', (req, res) => {
    res.render('privacy', {
        title: 'Политика конфиденциальности',
        user: req.isAuthenticated() ? req.user : null
    });
});

app.get('/terms', (req, res) => {
    res.render('terms', {
        title: 'Пользовательское соглашение',
        user: req.isAuthenticated() ? req.user : null
    });
});

app.get('/cookies', (req, res) => {
    res.render('cookies', {
        title: 'Политика использования cookies',
        user: req.isAuthenticated() ? req.user : null
    });
});

app.get('/api/server-members', checkAuth, async (req, res) => {
    try {
        const guildId = process.env.DISCORD_GUILD_ID;
        const response = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
            headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
        });

        const members = response.data.map(member => ({
            id: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            avatar: member.user.avatar,
            joined_at: member.joined_at
        }));

        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.get('/api/export-data', checkAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM warns ORDER BY created_at DESC');

        // Формируем CSV
        let csv = 'User ID,Username,Moderator ID,Reason,Date\n';
        result.rows.forEach(row => {
            csv += `"${row.user_id}","${row.user_name}","${row.moderator_id}","${row.reason}","${row.created_at}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=warnings_export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).send('Export failed');
    }
});

// Маршрут для получения профиля пользователя
app.get('/api/user-profile/:userId', checkAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Получаем базовую информацию о пользователе
        const userResponse = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
            headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
        });

        // 2. Получаем информацию о членстве в гильдии
        const guildResponse = await axios.get(
            `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`,
            {
                headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
            }
        ).catch(err => ({ data: {} })); // Если пользователь не на сервере

        // 3. Получаем информацию о ролях
        let roles = [];
        if (guildResponse.data.roles) {
            roles = await Promise.all(
                guildResponse.data.roles.map(async roleId => {
                    const roleResponse = await axios.get(
                        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/roles/${roleId}`,
                        {
                            headers: { 'Authorization': `Bot ${process.env.DISCORD_TOKEN}` }
                        }
                    );
                    return roleResponse.data;
                })
            );
        }

        // 4. Получаем статус пользователя (если бот онлайн)
        let status = 'offline';
        if (client) {
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
            if (guild) {
                const member = guild.members.cache.get(userId);
                if (member) {
                    status = member.presence?.status || 'offline';
                }
            }
        }

        // 5. Получаем предупреждения из БД
        const warnings = await pool.query(
            'SELECT * FROM warns WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.set('Cache-Control', 'no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.json({
            ...userResponse.data,
            joined_at: guildResponse.data.joined_at,
            roles: roles,
            warnings: warnings.rows,
            status: status
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

app.get('/api/online-members', checkAuth, async (req, res) => {
    try {
        if (!client) {
            return res.status(500).json({ error: 'Discord client not initialized' });
        }

        const guildId = process.env.DISCORD_GUILD_ID;
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // Загружаем всех участников с presence data
        await guild.members.fetch({ withPresences: true });

        const onlineMembers = guild.members.cache
            .filter(member => {
                const status = member.presence?.status;
                return status === 'online' || status === 'idle' || status === 'dnd';
            })
            .map(member => ({
                id: member.user.id,
                username: member.user.username,
                avatar: member.user.avatar,
                discriminator: member.user.discriminator,
                status: member.presence?.status || 'offline'
            }));

        res.json(onlineMembers);
    } catch (error) {
        console.error('Error fetching online members:', error);
        res.status(500).json({ error: 'Failed to fetch online members' });
    }
});

app.get('/api/verification-requests', checkAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const validStatuses = ['pending', 'approved', 'rejected'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status parameter' });
        }

        // Используем sequelize напрямую, если модель не работает
        const requests = await sequelize.models.VerificationRequest.findAll({
            where: status ? { status } : {},
            order: [['created_at', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching verification requests:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message // Добавляем детали ошибки для отладки
        });
    }
});

app.get('/api/verification-requests/count', async (req, res) => {
    try {
        // Правильный метод для Sequelize
        const count = await VerificationRequest.count({
            where: { status: 'pending' }
        });
        
        res.json({ total: count || 0 });
    } catch (error) {
        console.error('Count error:', error);
        res.json({ total: 0 });
    }
});

app.patch('/api/verification-requests/:requestId', checkAuth, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const request = await VerificationRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Обновляем заявку
        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.moderator_id = req.user.id;
        request.moderator_name = req.user.username;
        request.reason = reason || null;
        await request.save();

        // Если нужно, можно добавить логику для Discord
        // Например, снять временную роль при одобрении

        res.json({ success: true, request });
    } catch (error) {
        console.error('Error processing verification request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/add-warning', checkAuth, async (req, res) => {
    try {
        const { userId, username, reason } = req.body;

        await pool.query(
            `INSERT INTO warns 
            (user_id, user_name, moderator_id, reason, guild_id) 
            VALUES ($1, $2, $3, $4, $5)`,
            [userId, username, req.user.id, reason, process.env.DISCORD_GUILD_ID]
        );

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding warning:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Вспомогательные функции
function checkAuth(req, res, next) {
    console.log('Auth check:', req.isAuthenticated()); // Логирование
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}

