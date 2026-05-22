
export interface Rendezvous {
    id?: string;
    manUid: string;
    womanUid: string;
    status: 'pending_payment' | 'waiting_payment_validation' | 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
    proposedDate: string; // ISO date-time string
    location: string;
    notes?: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    
    // Payment details
    paymentMethod?: 'fedapay' | 'offline';
    paymentStatus?: 'pending' | 'paid' | 'waiting_validation' | 'rejected';
    paymentProofUrl?: string;
    paymentTransactionId?: string;

    // For post-rendezvous flow
    qrCodeScanned?: boolean;
    scanLocation?: { lat: number, lng: number };
    selfieProofUrl?: string;
    selfieValidationStatus?: 'pending' | 'approved' | 'rejected';
    mysteryBoxClaimed?: boolean;
}
