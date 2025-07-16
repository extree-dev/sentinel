const { Events } = require('discord.js');
const TEMP_ROLE_ID = process.env.TEMP_ROLE_ID;

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            if (!TEMP_ROLE_ID) {
                console.error('[ERROR] TEMP_ROLE_ID не установлен в .env');
                return;
            }

            const role = member.guild.roles.cache.get(TEMP_ROLE_ID);
            if (!role) {
                console.error(`[ERROR] Роль с ID ${TEMP_ROLE_ID} не найдена`);
                return;
            }

            if (!member.manageable) {
                console.error(`[ERROR] Не могу выдать роль пользователю ${member.user.tag}`);
                return;
            }

            await member.roles.add(role);
            console.log(`[LOG] Выдана временная роль пользователю ${member.user.tag}`);

        } catch (error) {
            console.error('[ERROR] Ошибка при выдаче роли:', error);
        }
    },
};