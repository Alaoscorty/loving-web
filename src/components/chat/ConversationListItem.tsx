
'use client';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import type { Conversation } from '@/types/conversation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, isUserOnline } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, doc, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { PlusCircle } from 'lucide-react';

type ConversationListItemProps = {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
};

export function ConversationListItem({ conversation, isSelected, onClick }: ConversationListItemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  if (!user) return null;

  const otherParticipantId = conversation.participants.find((p) => p !== user.uid);
  if (!otherParticipantId) return null;

  // 1. Récupérer le profil
  const otherProfileRef = doc(firestore, 'users', otherParticipantId);
  const { data: otherProfile } = useDoc<UserProfile>(otherProfileRef);

  // 2. Vérifier si l'utilisateur a des stories actives
  const storiesQuery = useMemo(() => {
    if (!firestore || !user || !otherParticipantId) return null;
    const now = new Date().toISOString();
    return query(
        collection(firestore, 'stories'),
        where('creatorUid', '==', otherParticipantId),
        where('expiresAt', '>', now)
    );
  }, [firestore, user, otherParticipantId]);

  const { data: stories } = useCollection<any>(storiesQuery);
  const hasStories = stories && stories.length > 0;

  const lastMessage = conversation.lastMessage;
  const otherProfileInfo = otherProfile || conversation.participantProfiles?.[otherParticipantId] || {};
  const online = otherProfile ? isUserOnline(otherProfile.lastActive) : false;
  const unreadCount = conversation.unreadCount?.[user.uid] || 0;
  const isTyping = conversation.typing?.[otherParticipantId];
  const otherName = otherProfileInfo.name || 'Utilisateur';
  const otherPhoto = otherProfileInfo.photoUrl;

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (hasStories) {
        e.stopPropagation();
        setIsStoryOpen(true);
    }
  };

  return (
    <>
        <button
        onClick={onClick}
        className={cn(
            'flex items-center gap-3 p-4 text-left w-full hover:bg-muted/50 transition-all border-b border-white/5 relative',
            isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-transparent'
        )}
        >
        <div className="relative group/avatar" onClick={handleAvatarClick}>
            <div className={cn(
                "p-[2px] rounded-full transition-all",
                hasStories ? "ring-2 ring-primary ring-offset-2 ring-offset-background cursor-pointer hover:scale-105" : ""
            )}>
                <Avatar className="h-12 w-12 border-2 border-primary/5">
                <AvatarImage src={otherPhoto} alt={otherName} className="object-cover" />
                <AvatarFallback className="font-bold">{otherName?.[0].toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
            </div>
            
            {online && (
                <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            )}
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-start mb-0.5">
                <p className={cn("font-bold text-sm truncate", unreadCount > 0 && "text-foreground")}>
                    {otherName}
                </p>
                {lastMessage && (
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false, locale: fr })}
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between gap-2">
                <p className={cn(
                    "text-xs truncate leading-relaxed flex-1",
                    unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                )}>
                    {isTyping ? (
                        <span className="text-primary italic animate-pulse">En train d'écrire...</span>
                    ) : (
                        <>
                            {lastMessage?.senderUid === user.uid && 'Vous: '}
                            {lastMessage?.text || (lastMessage?.imageUrl ? "📷 Photo" : 'Aucun message')}
                        </>
                    )}
                </p>
                {unreadCount > 0 && (
                    <Badge className="h-5 min-w-5 flex items-center justify-center p-0 text-[10px] rounded-full bg-primary animate-in zoom-in">
                        {unreadCount}
                    </Badge>
                )}
            </div>
        </div>
        </button>

        {hasStories && (
            <Dialog open={isStoryOpen} onOpenChange={setIsStoryOpen}>
                <DialogContent className="p-0 border-none bg-black max-w-md aspect-[9/16] overflow-hidden rounded-[2.5rem]">
                    <div className="relative w-full h-full">
                        <Image src={stories[0].imageUrl} alt="Story" fill className="object-cover" />
                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/20">
                                <AvatarImage src={otherPhoto} />
                                <AvatarFallback>{otherName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-white text-sm font-bold">{otherName}</p>
                                <p className="text-white/60 text-[10px]">Story active</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </>
  );
}
