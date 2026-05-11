
'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Conversation } from '@/types/conversation';
import { ConversationListItem } from './ConversationListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Inbox } from 'lucide-react';

type ConversationListProps = {
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
};

export function ConversationList({ selectedConversationId, onConversationSelect }: ConversationListProps) {
  const { user, activeProfileId } = useUser();
  const firestore = useFirestore();

  const q = useMemo(() => {
    // Utiliser activeProfileId pour filtrer les conversations du profil actuel
    if (!activeProfileId || !firestore) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', activeProfileId)
    );
  }, [activeProfileId, firestore]);

  const { data: conversations, loading, error } = useCollection<Conversation>(q);

  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    return [...conversations].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [conversations]);

  if (loading) {
    return (
      <div className="p-2 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
        <div className="p-4">
            <p className="text-xs text-destructive mb-2">Erreur de chargement des conversations.</p>
        </div>
    );
  }

  if (!sortedConversations || sortedConversations.length === 0) {
    return (
        <div className="p-4">
            <Alert>
                <Inbox className="h-4 w-4" />
                <AlertTitle>Aucune conversation</AlertTitle>
                <AlertDescription>
                    Une fois un rendez-vous accepté, vos discussions s'afficheront ici.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sortedConversations.map((convo) => (
        <ConversationListItem
          key={convo.id}
          conversation={convo}
          isSelected={selectedConversationId === convo.id}
          onClick={() => onConversationSelect(convo.id!)}
        />
      ))}
    </div>
  );
}
