require('dotenv').config();
const path = require('path');
const { REST, Routes, Collection } = require('discord.js');
const { connect } = require('./database/db');
const fs = require('fs');
const logger = require('./utils/logger');
const guildMemberAddEvent = require('./events/guildMemberAdd');
const interactionCreate = require('./utils/interactionCreate');
const setupVerification = require('./systems/verificationSystem');
const { spawn } = require('child_process');
const client = require('./discordClient');

// Инициализация коллекций
client.commands = new Collection();

const startServers = () => {
    const expressServer = spawn('node', ['my-mod-panel/src/server/server.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            PORT: 3001,
            NODE_ENV: 'development'
        }
    });

    const reactApp = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, 'my-mod-panel'),
        stdio: 'inherit',
        shell: true
    });

    expressServer.on('exit', (code) =>
        logger.log(`Express server exited with code ${code}`));
};

// Функция загрузки событий
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        client.on(event.name, (...args) => event.execute(...args, client));
    }
};

// Функция загрузки команд
const loadCommands = () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
};

// Функция регистрации команд
const registerCommands = async () => {
    try {
        const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        logger.log('Регистрация команд...');

        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            logger.log(`Команды зарегистрированы для гильдии ${process.env.GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            logger.log('Команды зарегистрированы глобально');
        }
    } catch (error) {
        logger.error('Ошибка регистрации команд:', error);
        throw error;
    }
};

// Основная функция инициализации
const initialize = async () => {
    try {
        await connect();
        startServers();
        console.log('Client type:', typeof client);
        console.log('Client prototype:', Object.getPrototypeOf(client));
        await client.login(process.env.DISCORD_TOKEN);


        loadEvents();
        loadCommands();
        await registerCommands();

        // Настройка обработчиков
        client.once('ready', () => {
            setupVerification(client);
            logger.log(`Бот ${client.user.tag} готов!`);
        });
        logger.log('Бот и серверы успешно запущены');
    } catch (error) {
        logger.error('Ошибка запуска:', error);
        process.exit(1);
    }
};

// Обработчики завершения работы
process.on('SIGINT', async () => {
    logger.log('Завершение работы...');
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', error => {
    logger.error('Необработанное исключение:', error);
});

// Запуск приложения
initialize();

process.on('SIGINT', async () => {
    logger.log('Завершение работы бота...');
    await client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', error => {
    logger.error('Необработанное исключение:', error);
});