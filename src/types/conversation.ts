
import type { Message } from './message';

export interface Conversation {
  id?: string;
  participants: string[]; // Array of UIDs
  participantProfiles: {
    [uid: string]: {
      name: string;
      photoUrl?: string;
      role?: string;
      isVerified?: boolean;
    }
  };
  lastMessage?: Message | null;
  updatedAt: string; // ISO date string
  typing?: {
    [uid: string]: boolean;
  };
  unreadCount?: {
    [uid: string]: number;
  };

  // Chat-specific settings
  settings?: {
    autoDeleteDays?: number; // 0 = never, 1, 7, 90, 240 (8 months)
    wallpaper?: string; // Hex color or URL
    theme?: 'default' | 'whatsapp' | 'modern' | 'minimal';
  };
}
