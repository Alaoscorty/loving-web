'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Loader2 } from 'lucide-react';
import { createStory } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { SuccessView } from './success-view';

export function StoriesFeed() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const storiesQuery = useMemo(() => {
    if (!firestore || !user) return null; // Garde d'authentification pour éviter les erreurs de permission
    const now = new Date().toISOString();
    return query(
        collection(firestore, 'stories'), 
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        limit(15)
    );
  }, [firestore, user]);

  const { data: stories, loading } = useCollection<any>(storiesQuery);

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore || !storage) return;

    setIsUploading(true);
    try {
      await createStory({ firestore, storage, userId: user.uid, photoFile: file });
      setShowSuccess(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
      setIsDialogOpen(false);
      setShowSuccess(false);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5 group-hover:border-primary group-hover:bg-primary/10 transition-all">
              <PlusCircle className="w-8 h-8 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-primary">Ma Story</span>
          </button>
        </DialogTrigger>
        <DialogContent className="rounded-[2.5rem]">
          {showSuccess ? (
              <SuccessView 
                title="Story publiée !"
                message="Votre moment éphémère est maintenant visible par toute la communauté pour les prochaines 24 heures."
                onBack={handleClose}
              />
          ) : (
              <>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Publier une Story</DialogTitle>
                </DialogHeader>
                <div className="py-8 space-y-6 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <PlusCircle className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground px-4">Partagez un moment éphémère avec la communauté. Votre story disparaîtra automatiquement dans 24 heures.</p>
                    <div className="flex justify-center pt-4">
                    <label className="cursor-pointer bg-primary text-white h-14 px-8 rounded-2xl hover:bg-primary/90 flex items-center gap-2 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                        {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                        Choisir une photo
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadStory} disabled={isUploading} />
                    </label>
                    </div>
                </div>
              </>
          )}
        </DialogContent>
      </Dialog>

      {!loading && stories?.map((story) => (
        <button key={story.id} className="flex flex-col items-center gap-2 min-w-[80px] animate-in fade-in zoom-in duration-500">
          <div className="relative w-16 h-16 rounded-full border-2 border-primary p-[3px] bg-background shadow-md">
            <Avatar className="w-full h-full border border-border">
              <AvatarImage src={story.creatorPhotoUrl} alt={story.creatorName} className="object-cover" />
              <AvatarFallback className="font-bold">{story.creatorName[0]}</AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[10px] font-bold truncate w-full text-center tracking-tighter">{story.creatorName.split(' ')[0]}</span>
        </button>
      ))}

      {loading && Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 min-w-[80px] animate-pulse">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="h-2 w-12 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}
