const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { VERIFICATION_CHANNEL_ID, TEMP_ROLE_ID } = process.env;

module.exports = async (client) => {
    const channel = await client.channels.fetch(VERIFICATION_CHANNEL_ID);
    if (!channel) return console.error('Канал верификации не найден!');

    // Проверяем, было ли уже отправлено сообщение
    const messages = await channel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

    if (existingMessage) return;

    const embed = new EmbedBuilder()
        .setTitle('Верификация')
        .setDescription('-# Нажмите кнопку ниже, чтобы подтвердить, что вы не бот')
        .setColor('#2b2d31');

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('verify_user')
            .setLabel('Подтвердить')
            .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ 
        embeds: [embed], 
        components: [button],
        flags: MessageFlags.Ephemeral
    });
};