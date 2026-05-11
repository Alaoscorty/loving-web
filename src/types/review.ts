
export interface Review {
    id?: string;
    fromUid: string;
    fromName: string;
    targetUid: string;
    targetName: string;
    rendezvousId: string;
    stars: number;
    text: string;
    isComplaint: boolean;
    status: 'pending' | 'investigating' | 'resolved';
    createdAt: string;
}
