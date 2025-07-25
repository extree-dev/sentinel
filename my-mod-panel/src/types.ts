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

export interface DiscordGuildMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
  };
  roles: string[];
  joined_at: string;
  nick?: string | null;
}