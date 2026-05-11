'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Loader2, CircleDashed } from 'lucide-react';
import { createStory } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

export function StoryTab() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, userProfile } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [viewingStory, setViewingStory] = useState<any | null>(null);

  const storiesQuery = useMemo(() => {
    if (!firestore || !user) return null; // Garde d'authentification
    const now = new Date().toISOString();
    return query(
        collection(firestore, 'stories'), 
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        limit(20)
    );
  }, [firestore, user]);

  const { data: stories, loading } = useCollection<any>(storiesQuery);

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore || !storage) return;

    setIsUploading(true);
    try {
      await createStory({ firestore, storage, userId: user.uid, photoFile: file });
      toast({ title: 'Story publiée !' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
        <div className="flex items-center gap-4 p-2">
            <label className="relative cursor-pointer group">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage src={userProfile?.photoUrl} className="object-cover" />
                    <AvatarFallback>{userProfile?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-background group-hover:scale-110 transition-transform">
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadStory} disabled={isUploading} />
            </label>
            <div>
                <p className="font-bold text-sm">Ma Story</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Partager un moment</p>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Récentes</h4>
            
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 animate-pulse">
                        <div className="h-12 w-12 rounded-full bg-muted" />
                        <div className="space-y-2">
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-2 w-16 bg-muted rounded" />
                        </div>
                    </div>
                ))
            ) : stories?.length === 0 ? (
                <div className="text-center py-10 opacity-40">
                    <CircleDashed className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-xs">Aucune story disponible</p>
                </div>
            ) : (
                stories.map((story) => (
                    <button 
                        key={story.id} 
                        onClick={() => setViewingStory(story)}
                        className="flex items-center gap-4 w-full p-2 hover:bg-muted/50 rounded-2xl transition-all text-left"
                    >
                        <div className="p-[2px] ring-2 ring-primary rounded-full ring-offset-2 ring-offset-background">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={story.creatorPhotoUrl} className="object-cover" />
                                <AvatarFallback>{story.creatorName[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div>
                            <p className="font-bold text-sm">{story.creatorName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Aujourd'hui</p>
                        </div>
                    </button>
                ))
            )}
        </div>

        {viewingStory && (
            <Dialog open={!!viewingStory} onOpenChange={(v) => !v && setViewingStory(null)}>
                <DialogContent className="p-0 border-none bg-black max-w-md aspect-[9/16] overflow-hidden rounded-[2.5rem]">
                    <div className="relative w-full h-full">
                        <Image src={viewingStory.imageUrl} alt="Story" fill className="object-cover" />
                        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/20">
                                <AvatarImage src={viewingStory.creatorPhotoUrl} />
                                <AvatarFallback>{viewingStory.creatorName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-white text-sm font-bold">{viewingStory.creatorName}</p>
                                <p className="text-white/60 text-[10px]">Story éphémère</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
