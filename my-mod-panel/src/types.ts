// src/types.ts
export type CaseType = 'ban' | 'warn' | 'mute' | 'report';

export interface DiscordUser {
    id: string;
    username: string;
    global_name?: string | null;
    discriminator: string;
    avatar?: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    avatar_decoration?: string | null;
    // Кастомные поля
    isAdmin?: boolean;
    isModerator?: boolean;
    roles: string[]; // Добавляем поле с ролями
}

export interface ModerationCase {
    id: string;
    userId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    type: CaseType;
    reason: string;
    createdAt: string;
    handled?: boolean;
}

export type DiscordGuildMember = {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    roles: string[];
    joined_at: string;
    is_bot: boolean;
    name: string,
};

export interface UserRole {
    id: string;
    name: string;
}

export interface User {
    id: string;
    username: string;
    discriminator: string;
    is_bot: boolean;
    joined_at: string;
    roles: (UserRole | string)[]; // Принимает как объекты, так и строки
}

export interface GuildRole {
    id: string;
    name: string;
    color: number;
    position: number;
    // другие свойства...
}