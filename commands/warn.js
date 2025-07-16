const { SlashCommandBuilder } = require('discord.js');
const Warn = require('../models/warn');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Выдать предупреждение пользователю')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Целевой пользователь')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина предупреждения')),
  
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Эта команда работает только на сервере',
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Не указана';

    try {
      // Создаём запись о предупреждении
      await Warn.create({
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        reason: reason,
        guildId: interaction.guild.id
      });

      // Получаем количество предупреждений
      const warnCount = await Warn.count({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id
        }
      });

      await interaction.reply({
        content: `⚠️ ${targetUser.tag} получил предупреждение (${warnCount}/${config.security.maxWarnings}). Причина: ${reason}`,
        ephemeral: false
      });

      // Автоматический мут при превышении лимита
      if (warnCount >= config.security.maxWarnings) {
        const muteRole = interaction.guild.roles.cache.get(config.moderation.muteRoleId);
        if (muteRole) {
          await interaction.guild.members.cache.get(targetUser.id).roles.add(muteRole);
          await interaction.followUp(`🔇 ${targetUser.tag} был замучен автоматически`);
        }
      }
    } catch (error) {
      console.error('Ошибка при выдаче предупреждения:', error);
      await interaction.reply({
        content: 'Произошла ошибка при выдаче предупреждения',
        ephemeral: true
      });
    }
  }
};