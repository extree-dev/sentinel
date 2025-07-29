// src/types.ts
export type CaseType = 'ban' | 'warn' | 'mute' | 'report';

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string | null;
    // Добавьте вложенный объект user
    user?: {
        id: string;
        username: string;
        avatar: string | null;
        discriminator: string;
    };
    roles?: Array<{
        id: string;
        name: string;
        color?: number;
        position?: number;
    }>;
    isAdmin?: boolean;
    isModerator?: boolean;
    isVerifier?: boolean; // Добавляем новое поле
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
    roles: DiscordRole[];
    joined_at: string;
    is_bot: boolean;
    isAdmin?: boolean;
    isModerator?: boolean;
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

export interface DiscordRole {
    id: string;
    name: string;
    color?: number;
    position?: number;
    permissions?: string;
    hoist?: boolean;
    managed?: boolean;
    mentionable?: boolean;
}

export interface VerificationUser {
    id: string;
    username: string;
    discriminator: string;
    status: 'pending' | 'approved' | 'rejected';
    registeredAt: string;
  }