// interactionCreate.js
const { Events, MessageFlags } = require('discord.js');
const verificationHandler = require('./verificationHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        try {
            // Обработка запроса верификации от пользователя
            if (interaction.customId === 'verify_user') {
                await verificationHandler.handleVerificationRequest(interaction);
            }
            
            // Обработка действий администратора
            else if (interaction.customId.startsWith('verify_accept_') || 
                     interaction.customId.startsWith('verify_reject_')) {
                await verificationHandler.handleAdminVerification(interaction);
            }
        } catch (error) {
            console.error('Ошибка обработки взаимодействия:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'Произошла ошибка при обработке запроса!', 
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({ 
                    content: 'Произошла ошибка при обработке запроса!', 
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};