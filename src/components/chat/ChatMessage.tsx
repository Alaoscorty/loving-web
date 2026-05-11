
'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Message } from '@/types/message';
import type { Conversation } from '@/types/conversation';
import type { UserProfile } from '@/types/user';
import { cn } from '@/lib/utils';
import { CheckCheck, Zap, Eye, MoreVertical, Trash2, Edit2, Shield, Verified, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { markViewOnceAsSeen, deleteMessageForEveryone, deleteMessageForMe, editMessage } from '@/lib/firebase-actions';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type ChatMessageProps = {
  message: Message;
  conversationId: string;
};

export function ChatMessage({ message, conversationId }: ChatMessageProps) {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isCurrentUser = message.senderUid === user?.uid;
  const isViewOnce = message.isViewOnce;
  const isSeen = message.viewedBy?.includes(user?.uid || '');
  const isDeleted = message.isDeletedForEveryone;
  const isDeletedForMe = message.deletedForUsers?.includes(user?.uid || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Récupérer la conversation pour identifier l'autre participant
  const convoRef = useMemo(() => firestore ? doc(firestore, 'conversations', conversationId) : null, [firestore, conversationId]);
  const { data: conversation } = useDoc<Conversation>(convoRef);
  
  const otherParticipantId = useMemo(() => {
      if (!conversation || !user) return null;
      return conversation.participants.find(p => p !== user.uid);
  }, [conversation, user]);

  // 2. Récupérer le profil du destinataire pour vérifier ses réglages de confidentialité
  const otherProfileRef = useMemo(() => firestore && otherParticipantId ? doc(firestore, 'users', otherParticipantId) : null, [firestore, otherParticipantId]);
  const { data: otherProfile } = useDoc<UserProfile>(otherProfileRef);

  // 3. Logique de l'accusé de lecture (Style WhatsApp)
  // On affiche le bleu si : 
  // - L'utilisateur actuel a activé les accusés
  // - ET le destinataire a activé les accusés
  const showBlueChecks = useMemo(() => {
      if (!isCurrentUser || !message.isRead) return false;
      const myPref = userProfile?.privacySettings?.showReadReceipts !== false;
      const otherPref = otherProfile?.privacySettings?.showReadReceipts !== false;
      return myPref && otherPref;
  }, [isCurrentUser, message.isRead, userProfile, otherProfile]);

  // Ne pas afficher si supprimé pour moi
  if (isDeletedForMe) return null;

  const handleOpenImage = () => {
    if (isViewOnce && !isSeen && user && firestore) {
        markViewOnceAsSeen(firestore, conversationId, message.id!, user.uid);
    }
  };

  const handleEdit = async () => {
      if (!editText.trim() || !firestore) return;
      setIsProcessing(true);
      try {
          await editMessage(firestore, conversationId, message.id!, editText);
          setIsEditing(false);
          toast({ title: 'Message modifié' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur lors de la modification' });
      } finally {
          setIsProcessing(false);
      }
  }

  const handleDelete = async (everyone: boolean) => {
      if (!firestore || !user) return;
      setIsProcessing(true);
      try {
          if (everyone) {
              await deleteMessageForEveryone(firestore, conversationId, message.id!);
              toast({ title: 'Message supprimé pour tous' });
          } else {
              await deleteMessageForMe(firestore, conversationId, message.id!, user.uid);
              toast({ title: 'Message supprimé pour vous' });
          }
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur lors de la suppression' });
      } finally {
          setIsProcessing(false);
      }
  }

  return (
    <div className={cn('flex items-end gap-1 group mb-4', isCurrentUser ? 'justify-end' : 'justify-start')}>
      {!isCurrentUser && !isDeleted && (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-full">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl">
                  <DropdownMenuItem onClick={() => handleDelete(false)} className="text-destructive text-xs">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer pour moi
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )}

      <div
        className={cn(
          'max-w-[85%] md:max-w-md rounded-2xl px-3 py-2 relative shadow-sm transition-all',
          isCurrentUser 
            ? 'bg-primary text-primary-foreground rounded-br-none' 
            : 'bg-muted rounded-bl-none',
          isDeleted && 'italic opacity-60 bg-muted/40'
        )}
      >
        {isDeleted ? (
            <p className="text-[11px] flex items-center gap-1.5">
                <span className="opacity-50">🚫</span> Ce message a été supprimé
            </p>
        ) : isEditing ? (
            <div className="space-y-2 min-w-[220px]">
                <Input 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)} 
                    className="h-8 text-xs bg-background/20 border-white/20 text-white placeholder:text-white/40"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold" onClick={() => setIsEditing(false)}>Annuler</Button>
                    <Button size="sm" className="h-6 text-[9px] font-bold bg-white text-primary hover:bg-white/90" onClick={handleEdit} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </div>
            </div>
        ) : (
            <>
                {message.type === 'image' && (
                    <div className="mb-2">
                        {isViewOnce && isSeen ? (
                            <div className="flex items-center gap-2 p-3 bg-black/10 rounded-xl italic text-[10px] opacity-70">
                                <Zap className="w-3.5 h-3.5" /> Message éphémère ouvert
                            </div>
                        ) : (
                            <Dialog onOpenChange={(open) => open && handleOpenImage()}>
                                <DialogTrigger asChild>
                                    <div className={cn(
                                        "relative aspect-square w-48 max-w-full rounded-xl overflow-hidden cursor-pointer border border-white/10 group/img",
                                        isViewOnce && "bg-primary/20 flex items-center justify-center border-dashed"
                                    )}>
                                        {isViewOnce ? (
                                            <div className="text-center space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                                                    <Zap className="w-5 h-5 text-primary" />
                                                </div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest">Voir une fois</p>
                                            </div>
                                        ) : (
                                            <>
                                                {message.imageUrl && (
                                                  <Image 
                                                      src={message.imageUrl} 
                                                      alt="Image" 
                                                      fill 
                                                      className="object-cover transition-transform group-hover/img:scale-105" 
                                                  />
                                                )}
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="w-6 h-6 text-white" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden shadow-2xl">
                                    <div className="relative h-[80vh] w-full">
                                        {message.imageUrl && <Image src={message.imageUrl} alt="Agrandissement" fill className="object-contain" />}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                )}

                {message.type === 'gif' && (
                    <div className="relative aspect-video w-48 md:w-64 rounded-xl overflow-hidden border border-white/10 mb-2">
                         {message.imageUrl && <Image src={message.imageUrl} alt="GIF" fill className="object-cover" unoptimized />}
                    </div>
                )}

                {message.text && <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.text}</p>}
                
                <div className={cn(
                    "flex items-center justify-end gap-1.5 mt-1 opacity-70",
                    isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                    {message.editedAt && <span className="text-[7px] italic font-bold uppercase tracking-tighter mr-1">modifié</span>}
                    <span className="text-[8px] font-bold">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isCurrentUser && (
                        <CheckCheck className={cn("w-3 h-3", showBlueChecks ? "text-blue-300" : "text-white/40")} />
                    )}
                </div>
            </>
        )}
      </div>

      {isCurrentUser && !isDeleted && !isEditing && (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-full">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                  {message.type === 'text' && (
                      <DropdownMenuItem onClick={() => { setIsEditing(true); setEditText(message.text || ''); }} className="text-xs">
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Modifier
                      </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleDelete(true)} className="text-destructive text-xs">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer pour tous
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(false)} className="text-destructive/60 text-xs">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer pour moi
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )}
    </div>
  );
}
