const path = require('path');
require('dotenv').config({
    path: path.join(__dirname, '../.env'),
    override: true,
    debug: true
});
const { pool,
    getWarningsFromDatabase,
    removeWarningFromDatabase } = require('./public/js/database');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

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

