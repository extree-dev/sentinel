const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Отправить жалобу модераторам')
    .addStringOption(option =>
      option.setName('жалоба')
        .setDescription('Опишите проблему')
        .setRequired(true)),
  
  async execute(interaction, client) {
    const report = interaction.options.getString('жалоба');
    const channel = client.channels.cache.get(client.config.reportChannelId);
    
    if (!channel) {
      return interaction.reply({ 
        content: '❌ Ошибка отправки жалобы', 
        ephemeral: true 
      });
    }
    
    const embed = {
      color: 0xff0000,
      title: '🚨 Новая жалоба',
      description: report,
      fields: [
        { name: 'Отправитель', value: interaction.user.tag },
        { name: 'ID', value: interaction.user.id }
      ],
      timestamp: new Date()
    };
    
    await channel.send({ embeds: [embed] });
    await interaction.reply({ 
      content: '✅ Ваша жалоба отправлена модераторам', 
      ephemeral: true 
    });
  }
};