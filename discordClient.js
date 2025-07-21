const { Client, GatewayIntentBits, Collection, REST, Routes, Events } = require('discord.js');
let clientInstance = null;

module.exports = {
    getClient: () => {
        if (!clientInstance) {
            clientInstance = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.GuildMembers,
                    GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.GuildPresences // Это важно для статусов!
                ]
            });
            clientInstance.login(process.env.DISCORD_TOKEN);
        }
        return clientInstance;
    }
};