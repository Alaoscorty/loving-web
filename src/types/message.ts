export interface Message {
    id?: string;
    senderUid: string;
    text?: string;
    imageUrl?: string;
    type: 'text' | 'image' | 'gif';
    isViewOnce?: boolean;
    viewedBy?: string[]; // Array of UIDs who have opened the view-once image
    timestamp: string; // ISO date-time string
    isRead?: boolean;
    
    // Message management
    editedAt?: string; // ISO date-time string if edited
    isDeletedForEveryone?: boolean;
    deletedForUsers?: string[]; // List of UIDs who deleted the message for themselves
}
