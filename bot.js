require('dotenv').config();
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes, Events } = require('discord.js');
const { connect } = require('./database/db');
const fs = require('fs');
const logger = require('./utils/logger');
const guildMemberAddEvent = require('./events/guildMemberAdd');
const interactionCreate = require('./utils/interactionCreate');
const setupVerification = require('./systems/verificationSystem');
const { spawn } = require('child_process'); // Заменяем fork на spawn
const { getClient } = require('./discordClient');
const client = getClient();

const startServers = () => {
    // 1. Запуск Express-сервера (ваш server.js)
    const expressServer = spawn('node', ['my-mod-panel/src/server/server.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            PORT: 3001, // Явно указываем порт
            NODE_ENV: 'development'
        }
    });

    // 2. Запуск React-приложения
    const reactApp = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'my-mod-panel'),
        stdio: 'inherit',
        shell: true
    });

    // Логирование
    expressServer.on('exit', (code) =>
        logger.log(`Express server exited with code ${code}`));
};

// Основная инициализация
(async () => {
    try {
        await connect();
        startServers(); // Заменяем startWebServer()

        // Инициализация бота
        client.commands = new Collection();
        loadEvents();
        loadCommands();
        await registerCommands();

        await client.login(process.env.DISCORD_TOKEN);
        logger.log('Бот и веб-сервер успешно запущены');
    } catch (error) {
        logger.error('Ошибка запуска:', error);
        process.exit(1);
    }
})();

client.on(Events.ClientReady, setupVerification);

client.on(Events.GuildMemberAdd, guildMemberAddEvent.execute);
client.on(Events.InteractionCreate, interactionCreate.execute);
client.commands = new Collection();
const config = require('./utils/config');

// Загрузка событий
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        client.on(event.name, (...args) => event.execute(...args, client));
    }
};

// Загрузка команд
const loadCommands = () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
};

const registerCommands = async () => {
    try {
        const commands = [];
        for (const [_, command] of client.commands) {
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        logger.log('Начинаю регистрацию команд...');

        // Для тестирования - регистрируем только на одном сервере
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, process.env.GUILD_ID),
                { body: commands }
            );
            logger.log(`Команды зарегистрированы для гильдии ${process.env.GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands }
            );
            logger.log('Команды зарегистрированы глобально');
        }

        logger.log(`Успешно зарегистрировано ${commands.length} команд!`);
    } catch (error) {
        logger.error('Ошибка регистрации команд:', error);
        throw error; // Пробрасываем ошибку дальше
    }
};

// Основная функция инициализации
const initializeBot = async () => {
    try {

        // Загрузка обработчиков
        loadEvents();
        loadCommands();

        // Регистрация команд
        await registerCommands();
    } catch (error) {
        logger.error('Ошибка при запуске бота:', error);
        process.exit(1);
    }
};

// Запуск бота
initializeBot();

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', async () => {
    logger.log('Завершение работы бота...');
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', error => {
    logger.error('Необработанное исключение:', error);
});