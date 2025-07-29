export  function getUsersWord(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return 'пользователь';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'пользователя';
    return 'пользователей';
}

export function getBotsWord(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return 'бот';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'бота';
    return 'ботов';
}