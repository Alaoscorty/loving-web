
export interface UserProfile {
    uid: string;
    ownerUid: string; // L'UID Firebase Auth du propriétaire
    role: 'woman' | 'man' | 'admin';
    email: string;
    name: string;
    birthDate?: string;
    photoUrl?: string;
    whatsappNumber?: string;
    maritalStatus?: string;
    secondaryPhotos?: { url: string; createdAt: string }[];
    city?: string;
    bio?: string;
    hobbies?: string[];
    profession?: string;
    situationFamiliale?: string;
    personalityTraits?: string[];
    goals?: string[];
    favorites?: string[]; // Array of favorited woman UIDs
    unlockedContacts?: string[]; // IDs of female profiles unlocked via pack
    unlockedNumbers?: string[]; // IDs of female profiles whose WhatsApp was paid individually
    createdAt: string; 
    points?: number;
    level?: string;
    likesCount?: number; // Nombre de likes reçus (pour les femmes)

    // Presence & Activity
    lastActive?: string; // ISO date-time string
    streak?: number;
    lastLogin?: string;
    swipesRemaining?: number;
    lastSwipeDate?: string;
    completedQuests?: string[];
    socialFollows?: string[]; // Plateformes suivies pour récompenses (facebook, tiktok, instagram)

    // Premium / Blue Badge
    isVerified?: boolean;
    verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
    verificationExpiresAt?: string;
    verificationProofUrl?: string;
    verificationRejectionReason?: string;
    renewalReminderSent?: boolean;

    photoReminderSent?: boolean;
    
    // Average rating
    rating?: number;
    reviewCount?: number;

    // Multi-profile
    isMaster?: boolean; 
    maxSubProfiles?: number; 
    birthdayBonusLastClaimedYear?: number;

    // Privacy Settings
    privacySettings?: {
        showOnlineStatus: boolean;
        showReadReceipts: boolean;
    };
}
