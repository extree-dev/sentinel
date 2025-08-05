import { Client } from 'discord.js';

const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'GuildMembers']
});

client.on('ready', () => {
  console.log(`Discord client ready! Logged in as ${client.user.tag}`);
});

await client.login(process.env.DISCORD_BOT_TOKEN);

export { client };