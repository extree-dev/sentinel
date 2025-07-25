// src/types.ts
export type CaseType = 'ban' | 'warn' | 'mute' | 'report';

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    isAdmin?: boolean;
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