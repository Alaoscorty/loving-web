
'use client';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { Message } from '@/types/message';
import type { Conversation } from '@/types/conversation';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { isUserOnline } from '@/lib/utils';
import type { UserProfile } from '@/types/user';
import { markConversationAsRead, updateConversationSettings, deleteMessageForMe } from '@/lib/firebase-actions';
import { Shield, Verified, Settings, Timer, AlertCircle, Loader2, Palette, Image as ImageIcon, Trash2, Phone, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CallSimulation } from './CallSimulation';

type ChatViewProps = {
  conversationId: string;
};

const DISAPPEARING_OPTIONS = [
    { label: 'Désactivé', value: 0 },
    { label: '24 heures', value: 1 },
    { label: '7 jours', value: 7 },
    { label: '3 mois', value: 90 },
    { label: '8 mois', value: 240 },
];

const WALLPAPERS = [
    { id: 'default', label: 'Par défaut', color: 'bg-background' },
    { id: 'wa-light', label: 'WhatsApp Light', color: 'bg-[#e5ddd5]' },
    { id: 'wa-dark', label: 'WhatsApp Dark', color: 'bg-[#0b141a]' },
    { id: 'loving', label: 'Loving Pink', color: 'bg-primary/5' },
    { id: 'blue', label: 'Ciel', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'teal', label: 'Canard', color: 'bg-teal-100 dark:bg-teal-900/20' },
    { id: 'beige', label: 'Sable', color: 'bg-[#f0ece3]' },
];

export function ChatView({ conversationId }: ChatViewProps) {
  const { user, activeProfileId } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);

  const conversationRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, loading: loadingConversation } = useDoc<Conversation>(conversationRef);

  useEffect(() => {
    if (firestore && activeProfileId && conversationId) {
        markConversationAsRead(firestore, conversationId, activeProfileId);
    }
  }, [firestore, activeProfileId, conversationId]);

  const otherParticipantId = useMemo(() => {
      if (!conversation || !activeProfileId) return null;
      return conversation.participants.find(p => p !== activeProfileId);
  }, [conversation, activeProfileId]);

  const otherProfileRef = useMemo(() => {
      if (!firestore || !otherParticipantId) return null;
      return doc(firestore, 'users', otherParticipantId);
  }, [firestore, otherParticipantId]);

  const { data: otherProfile } = useDoc<UserProfile>(otherProfileRef);

  const messagesQuery = useMemo(() => {
    if (!conversationRef) return null;
    return query(collection(conversationRef, 'messages'), orderBy('timestamp', 'asc'));
  }, [conversationRef]);

  const { data: rawMessages, loading: loadingMessages } = useCollection<Message>(messagesQuery);
  
  const filteredMessages = useMemo(() => {
      if (!rawMessages || !conversation) return [];
      const autoDeleteDays = conversation.settings?.autoDeleteDays ?? 240;
      
      if (autoDeleteDays === 0) return rawMessages;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - autoDeleteDays);
      return rawMessages.filter(msg => {
          if (!msg.timestamp) return true;
          return new Date(msg.timestamp) > cutoff;
      });
  }, [rawMessages, conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const handleUpdateAutoDelete = async (val: string) => {
      if (!firestore) return;
      setIsSaving(true);
      try {
          await updateConversationSettings(firestore, conversationId, { autoDeleteDays: parseInt(val) });
          toast({ title: 'Paramètres mis à jour' });
      } finally {
          setIsSaving(false);
      }
  }

  const handleUpdateWallpaper = async (val: string) => {
      if (!firestore) return;
      setIsSaving(true);
      try {
          await updateConversationSettings(firestore, conversationId, { wallpaper: val });
          toast({ title: 'Fond d\'écran mis à jour' });
      } finally {
          setIsSaving(false);
      }
  }

  const handleClearChat = async () => {
      if (!firestore || !activeProfileId || !rawMessages) return;
      setIsClearing(true);
      try {
          const batch = writeBatch(firestore);
          rawMessages.forEach(msg => {
              const msgRef = doc(firestore, 'conversations', conversationId, 'messages', msg.id!);
              batch.update(msgRef, {
                  deletedForUsers: Array.from(new Set([...(msg.deletedForUsers || []), activeProfileId]))
              });
          });
          await batch.commit();
          toast({ title: 'Conversation vidée' });
          setIsSettingsOpen(false);
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur' });
      } finally {
          setIsClearing(false);
      }
  }

  const isOtherTyping = otherParticipantId && conversation?.typing?.[otherParticipantId];

  if (loadingConversation || !activeProfileId) {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-3 p-3 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </header>
            <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-10 w-3/5" />
                <Skeleton className="h-10 w-1/2 ml-auto" />
            </div>
            <footer className="p-3 border-t">
                <Skeleton className="h-10 w-full" />
            </footer>
        </div>
    );
  }
  
  if (!conversation) {
    return <p className="p-8 text-center text-muted-foreground">Conversation non trouvée.</p>
  }

  const otherProfileInfo = otherProfile || conversation.participantProfiles?.[otherParticipantId!] || {};
  const showOnlineStatus = otherProfile?.privacySettings?.showOnlineStatus !== false;
  const online = (otherProfile && showOnlineStatus) ? isUserOnline(otherProfile.lastActive) : false;
  const otherName = otherProfileInfo.name || 'Utilisateur';
  const otherRole = otherProfileInfo.role;
  const otherVerified = otherProfileInfo.isVerified;
  const otherPhoto = otherProfileInfo.photoUrl;

  const currentWallpaper = WALLPAPERS.find(w => w.id === conversation.settings?.wallpaper) || WALLPAPERS[0];
  const autoDeleteDays = conversation.settings?.autoDeleteDays ?? 240;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
            <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarImage src={otherPhoto} alt={otherName} className="object-cover" />
                    <AvatarFallback className="font-bold">{otherName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {online && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                )}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold leading-none text-sm">{otherName}</p>
                    {otherRole === 'admin' ? (
                        <Shield className="w-3.5 h-3.5 text-destructive fill-destructive" />
                    ) : otherVerified && (
                        <Verified className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    )}
                </div>
                <div className="flex items-center gap-1.5 h-3">
                    {isOtherTyping ? (
                        <span className="text-[10px] text-primary font-bold italic animate-pulse">En train d'écrire...</span>
                    ) : online ? (
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">En ligne</span>
                    ) : (
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Hors ligne</span>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 text-muted-foreground" onClick={() => setActiveCall('audio')}>
                <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 text-muted-foreground" onClick={() => setActiveCall('video')}>
                <Video className="w-5 h-5" />
            </Button>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/5">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] sm:max-w-md max-h-[85vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                            <Settings className="w-6 h-6 text-primary" /> Options de chat
                        </DialogTitle>
                        <DialogDescription>Personnalisez votre expérience pour cette conversation.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-8 py-4">
                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Timer className="w-4 h-4" /> Messages éphémères
                            </h4>
                            <RadioGroup 
                                defaultValue={String(autoDeleteDays)} 
                                onValueChange={handleUpdateAutoDelete}
                                className="space-y-1"
                            >
                                {DISAPPEARING_OPTIONS.map(opt => (
                                    <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                                        <RadioGroupItem value={String(opt.value)} id={`opt-${opt.value}`} />
                                        <Label htmlFor={`opt-${opt.value}`} className="flex-1 cursor-pointer font-bold">{opt.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Palette className="w-4 h-4" /> Fond d'écran
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {WALLPAPERS.map(wp => (
                                    <button
                                        key={wp.id}
                                        onClick={() => handleUpdateWallpaper(wp.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all",
                                            conversation.settings?.wallpaper === wp.id ? "border-primary bg-primary/10 shadow-lg" : "border-transparent bg-muted/30 hover:bg-muted"
                                        )}
                                    >
                                        <div className={cn("w-full aspect-video rounded-lg shadow-inner", wp.color)} />
                                        <span className="text-[10px] font-bold">{wp.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 text-destructive">
                                <Trash2 className="w-4 h-4" /> Zone de danger
                            </h4>
                            <Button 
                                variant="outline" 
                                className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/5 font-bold gap-2"
                                onClick={handleClearChat}
                                disabled={isClearing}
                            >
                                {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Vider la conversation
                            </Button>
                        </section>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Certains réglages (éphémère, fond d'écran) affectent l'affichage pour les deux participants.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </header>
      
      <div className={cn("flex-1 overflow-y-auto p-4 space-y-2 relative transition-colors duration-500", currentWallpaper.color)}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />

        {loadingMessages && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        
        {autoDeleteDays > 0 && (
            <div className="flex justify-center mb-6 relative z-10">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-md text-primary border-primary/10 text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full flex gap-2 items-center shadow-sm">
                    <Timer className="w-3 h-3" /> Messages éphémères : {DISAPPEARING_OPTIONS.find(o => o.value === autoDeleteDays)?.label}
                </Badge>
            </div>
        )}

        <div className="space-y-1 relative z-10">
            {filteredMessages?.map((msg) => (
            <ChatMessage key={msg.id} message={msg} conversationId={conversationId} />
            ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t bg-card/50 backdrop-blur-md shrink-0">
        <ChatInput conversationId={conversationId} />
      </footer>

      {activeCall && (
          <CallSimulation 
            type={activeCall} 
            targetProfile={otherProfileInfo} 
            onClose={() => setActiveCall(null)} 
          />
      )}
    </div>
  );
}
