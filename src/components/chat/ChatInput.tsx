'use client';
import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { sendMessage, updateTypingStatus } from '@/lib/firebase-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ImagePlus, Loader2, Zap, ZapOff, Smile, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ChatInputProps = {
  conversationId: string;
};

// Liste d'emojis unique pour éviter l'erreur de clé React
const EMOJIS = [
  '❤️', '🔥', '✨', '😂', '😍', '🙌', '🙏', '👍', 
  '😉', '🥂', '🌹', '💎', '🥰', '🤩', '😘', '😊',
  '🥳', '😎', '😜', '🤝', '😇', '👀', '🎉', '🎁'
];

export function ChatInput({ conversationId }: ChatInputProps) {
  const { user, activeProfileId } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async (e?: React.FormEvent, photoFile?: File, type: 'text' | 'image' | 'gif' = 'text', imageUrl?: string) => {
    e?.preventDefault();
    if (!user || !activeProfileId || !firestore || (!text.trim() && !photoFile && !imageUrl)) return;

    setIsSending(true);
    try {
        const messageText = text;
        setText('');
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            updateTypingStatus(firestore, conversationId, activeProfileId, false);
        }

        await sendMessage({ 
            firestore, 
            storage, 
            conversationId, 
            senderUid: activeProfileId, 
            senderOwnerUid: user.uid,
            text: type === 'text' ? messageText : '',
            photoFile,
            type,
            imageUrl,
            isViewOnce: (type === 'image' || type === 'gif') ? isViewOnce : false
        });

        if (isViewOnce) setIsViewOnce(false);
        if (photoFile || imageUrl) {
            toast({ title: 'Média envoyé !' });
        }
    } catch (error: any) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Erreur d\'envoi',
            description: "L'accès au serveur a été refusé. Vérifiez votre connexion.",
        });
    } finally {
        setIsSending(false);
    }
  };

  const handleGifSearch = async () => {
      if (!gifSearch.trim()) return;
      setIsLoadingGifs(true);
      try {
          const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=8`);
          const json = await res.json();
          setGifs(json.data || []);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingGifs(false);
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleSend(undefined, file, 'image');
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      if (!activeProfileId || !firestore) return;

      updateTypingStatus(firestore, conversationId, activeProfileId, true);

      if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
          updateTypingStatus(firestore, conversationId, activeProfileId, false);
          typingTimeoutRef.current = null;
      }, 3000);
  };

  useEffect(() => {
      return () => {
          if (typingTimeoutRef.current && activeProfileId && firestore) {
              updateTypingStatus(firestore, conversationId, activeProfileId, false);
          }
      };
  }, [activeProfileId, firestore, conversationId]);

  return (
    <div className="space-y-2">
        <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-muted-foreground hover:text-primary">
                            <Smile className="w-6 h-6" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-2xl">
                        <Tabs defaultValue="emojis">
                            <TabsList className="grid grid-cols-2 mb-4 h-8 bg-muted/50 rounded-xl">
                                <TabsTrigger value="emojis" className="text-[10px] uppercase font-bold rounded-lg">Emojis</TabsTrigger>
                                <TabsTrigger value="gifs" className="text-[10px] uppercase font-bold rounded-lg">GIFs</TabsTrigger>
                            </TabsList>
                            <TabsContent value="emojis">
                                <div className="grid grid-cols-4 gap-2">
                                    {EMOJIS.map(e => (
                                        <button 
                                            key={`emoji-${e}`} 
                                            type="button"
                                            onClick={() => setText(prev => prev + e)}
                                            className="h-10 text-xl hover:bg-muted rounded-xl transition-colors"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="gifs" className="space-y-3">
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Chercher..." 
                                        className="h-8 text-xs rounded-lg" 
                                        value={gifSearch}
                                        onChange={(e) => setGifSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGifSearch()}
                                    />
                                    <Button size="sm" type="button" className="h-8 px-3" onClick={handleGifSearch}>Ok</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {isLoadingGifs ? (
                                        <div className="col-span-2 flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : (
                                        gifs.map(g => (
                                            <button 
                                                key={g.id} 
                                                type="button" 
                                                className="relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-all"
                                                onClick={() => handleSend(undefined, undefined, 'gif', g.images.fixed_height.url)}
                                            >
                                                <img src={g.images.fixed_height_small.url} className="object-cover w-full h-full" alt="gif" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </PopoverContent>
                </Popover>

                <label className="cursor-pointer">
                    <div className={cn(
                        "flex items-center justify-center h-11 w-11 rounded-full transition-all border border-white/5",
                        isSending ? "bg-muted" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}>
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isSending} />
                </label>

                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-11 w-11 rounded-full border border-white/5",
                        isViewOnce ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    onClick={() => setIsViewOnce(!isViewOnce)}
                    title={isViewOnce ? "Vue unique activée" : "Vue unique désactivée"}
                >
                    {isViewOnce ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </Button>
            </div>

            <Input
                value={text}
                onChange={handleInputChange}
                placeholder="Écrivez un message..."
                autoComplete="off"
                disabled={isSending}
                className="rounded-full bg-background border-white/5 h-11 px-6 flex-1 shadow-inner"
            />

            <Button type="submit" size="icon" disabled={isSending || !text.trim()} className="rounded-full h-11 w-11 shadow-lg shadow-primary/20">
                <Send className="w-5 h-5" />
                <span className="sr-only">Envoyer</span>
            </Button>
        </form>
        {isViewOnce && (
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest pl-32 animate-pulse">
                Mode vue unique activé
            </p>
        )}
    </div>
  );
}
