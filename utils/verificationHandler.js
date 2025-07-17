const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { VERIFICATION_LOG_CHANNEL_ID, TEMP_ROLE_ID, ADMIN_ROLE_ID } = process.env;

module.exports = {
    async handleVerificationRequest(interaction) {
        try {
            // 1. Получаем необходимые данные
            const user = interaction.user;
            const member = interaction.member;
            const guild = interaction.guild;
            
            // 2. Проверяем наличие временной роли
            const tempRole = guild.roles.cache.get(TEMP_ROLE_ID);
            if (!tempRole) throw new Error('Роль верификации не найдена!');
            
            if (!member.roles.cache.has(tempRole.id)) {
                return interaction.reply({ 
                    content: '-# У вас нет роли для верификации!', 
                    flags: MessageFlags.Ephemeral
                });
            }

            // 3. Отправляем запрос в канал администрации
            const logChannel = guild.channels.cache.get(VERIFICATION_LOG_CHANNEL_ID);
            if (!logChannel) throw new Error('Канал верификации не найден!');

            const embed = new EmbedBuilder()
                .setTitle('Запрос на верификацию')
                .setDescription(`-# Пользователь ${user.tag} (ID: ${user.id}) запрашивает верификацию`)
                .setColor('#FFA500')
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Аккаунт создан', value: user.createdAt.toLocaleString(), inline: true },
                    { name: 'Присоединился', value: member.joinedAt.toLocaleString(), inline: true }
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`verify_accept_${user.id}`)
                    .setLabel('Верифицировать')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`verify_reject_${user.id}`)
                    .setLabel('Отклонить')
                    .setStyle(ButtonStyle.Secondary)
            );

            await logChannel.send({ 
                content: `-# <@&${ADMIN_ROLE_ID}> Новый запрос на верификацию`, 
                embeds: [embed], 
                components: [buttons] 
            });

            // 4. Отвечаем пользователю
            await interaction.reply({ 
                content: '-# Ваш запрос на верификацию отправлен администраторам', 
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Ошибка обработки верификации:', error);
            await interaction.reply({ 
                content: '-# Произошла ошибка при обработке вашего запроса!', 
                flags: MessageFlags.Ephemeral
            });
        }
    },

    async handleAdminVerification(interaction) {
        try {
            // 1. Проверяем права администратора
            if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
                return interaction.reply({ 
                    content: '-# У вас нет прав для этого действия!', 
                    flags: MessageFlags.Ephemeral
                });
            }

            // 2. Разбираем customId (формат: verify_[action]_[userId])
            const [_, action, userId] = interaction.customId.split('_');
            const guild = interaction.guild;
            const member = await guild.members.fetch(userId);
            const tempRole = guild.roles.cache.get(TEMP_ROLE_ID);

            // 3. Обрабатываем действие
            if (action === 'accept') {
                await member.roles.remove(tempRole);
                await interaction.reply({ 
                    content: `-# Пользователь ${member.user.tag} успешно верифицирован!`, 
                    flags: MessageFlags.Ephemeral
                });
                
                // Можно отправить уведомление пользователю
                await member.send('-# Вы успешно прошли верификацию!').catch(() => {});
                
            } else if (action === 'reject') {
                await interaction.reply({ 
                    content: `-# Верификация пользователя ${member.user.tag} отклонена!`, 
                    flags: MessageFlags.Ephemeral
                });
                
                // Отправляем сообщение пользователю
                await member.send('-# Верификация не удалась, причина: Отклонена Администратором Сервера').catch(() => {});
            }

            // 4. Удаляем кнопки из сообщения
            await interaction.message.edit({ components: [] });

        } catch (error) {
            console.error('Ошибка обработки админской верификации:', error);
            await interaction.reply({ 
                content: '-# Произошла ошибка при обработке запроса!', 
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

