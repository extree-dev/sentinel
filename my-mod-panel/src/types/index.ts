export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  }
  
  export interface ModerationCase {
    id: string;
    userId: string;
    username: string;
    type: 'ban' | 'warn' | 'mute';
    reason: string;
    createdAt: string;
  }