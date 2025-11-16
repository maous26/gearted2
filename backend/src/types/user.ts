export interface User {
  id: string;
  discordId?: string;
  username: string;
  email: string;
  avatar: string | null;
  teamName: string;
  points: number;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscordUserData {
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  points: number;
  badges: string[];
  roles: string[];
}
