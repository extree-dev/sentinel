const { Events, MessageFlags } = require('discord.js');
const TEMP_ROLE_ID = process.env.TEMP_ROLE_ID;

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'verify_user') return;

        try {
            const role = interaction.guild.roles.cache.get(TEMP_ROLE_ID);
            if (!role) throw new Error('Роль верификации не найдена!');

            if (!interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({ 
                    content: '-# У вас нет роли для верификации!', 
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.member.roles.remove(role);
            await interaction.reply({ 
                content: '-# Вы успешно верифицированы!', 
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Ошибка верификации:', error);
            await interaction.reply({ 
                content: 'Произошла ошибка при верификации!', 
                ephemeral: true 
            });
        }
    },
};