const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Замутить пользователя')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Пользователь для мута')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Длительность мута в минутах')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина мута')),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'Не указана';

    const muteRole = interaction.guild.roles.cache.get(config.moderation.muteRoleId);
    if (!muteRole) {
      return interaction.reply({
        content: 'Роль для мута не найдена!',
        ephemeral: true
      });
    }

    try {
      await interaction.guild.members.addRole({
        user: targetUser,
        role: muteRole,
        reason: `Мут на ${duration} минут. Причина: ${reason}`
      });

      await interaction.reply({
        content: `🔇 ${targetUser.tag} был замучен на ${duration} минут. Причина: ${reason}`,
        ephemeral: false
      });

      // Автоматическое снятие мута
      setTimeout(async () => {
        try {
          await interaction.guild.members.removeRole({
            user: targetUser,
            role: muteRole,
            reason: 'Автоматическое снятие мута'
          });
          interaction.channel.send(`🔊 ${targetUser.tag} был размучен автоматически`);
        } catch (e) {
          logger.error(`Ошибка при автоматическом снятии мута: ${e}`);
        }
      }, duration * 60 * 1000);

    } catch (e) {
      logger.error(`Ошибка при выдаче мута: ${e}`);
      interaction.reply({
        content: 'Произошла ошибка при выдаче мута',
        ephemeral: true
      });
    }
  }
};