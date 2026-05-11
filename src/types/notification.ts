
export interface Notification {
  id?: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'rendezvous_new' | 'rendezvous_accepted' | 'rendezvous_declined' | 'payment_validated' | 'payment_rejected' | 'selfie_validated' | 'message_new';
  link?: string;
  isRead: boolean;
  createdAt: string; // ISO date-time string
}
