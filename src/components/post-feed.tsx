'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, Loader2, Heart, MessageCircle, Share2, Info } from 'lucide-react';
import { createPost, likePost } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from './ui/alert';

export function PostFeed() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, userProfile } = useUser();
  const { toast } = useToast();

  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingLikeId, setProcessingLikeId] = useState<string | null>(null);

  const postsQuery = useMemo(() => {
    // Correction : On attend que l'utilisateur soit authentifié avant de lancer la requête
    // pour éviter l'erreur FirestorePermissionError (operation: list)
    if (!firestore || !user) return null;
    
    // On ne récupère que les posts des 5 derniers mois
    const fiveMonthsAgo = subMonths(new Date(), 5).toISOString();
    return query(
      collection(firestore, 'posts'), 
      where('createdAt', '>', fiveMonthsAgo),
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
  }, [firestore, user]);

  const { data: posts, loading } = useCollection<any>(postsQuery);

  const handleCreatePost = async () => {
    if (!postText.trim() || !user || !firestore || !storage) return;
    setIsPosting(true);
    try {
      await createPost({ firestore, storage, userId: user.uid, text: postText, photoFile: selectedFile });
      setPostText('');
      setSelectedFile(null);
      toast({ title: 'Publication réussie !', description: 'Votre post a été partagé.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user || !firestore) return;
    setProcessingLikeId(postId);
    try {
        await likePost({ firestore, userId: user.uid, postId });
    } catch (e) {
        console.error(e);
    } finally {
        setProcessingLikeId(null);
    }
  };

  return (
    <div className="space-y-6">
      {userProfile?.role === 'woman' && (
        <Card className="rounded-3xl border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-6">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Exprimez-vous
            </h3>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <Textarea 
              placeholder="Partagez un moment, une pensée..." 
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="min-h-[100px] resize-none rounded-2xl bg-background/50 border-white/5"
            />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ImagePlus className="w-5 h-5" />
                </div>
                <span className="font-medium">{selectedFile ? selectedFile.name : 'Ajouter une photo'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
              <Button onClick={handleCreatePost} disabled={isPosting || !postText.trim()} className="rounded-xl px-8 font-bold">
                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publier
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <Info className="w-3 h-3" /> Les publications expirent après 5 mois.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse rounded-3xl border-none h-64 bg-card/40" />
      ))}

      {!loading && posts?.length === 0 && (
          <div className="py-20 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed">
            <p className="text-muted-foreground">Aucune publication récente.</p>
          </div>
      )}

      {!loading && posts?.map((post) => (
        <Card key={post.id} className="overflow-hidden rounded-[2.5rem] border-none shadow-xl bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 flex flex-row items-center gap-4">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={post.creatorPhotoUrl} className="object-cover" />
              <AvatarFallback>{post.creatorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-sm">{post.creatorName}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>
            {post.imageUrl && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-inner border border-white/5">
                <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-white/5 flex justify-around">
            <Button 
                variant="ghost" 
                size="sm" 
                className={cn("flex-1 gap-2 rounded-xl h-10", post.likesCount > 0 && "text-primary")}
                onClick={() => handleLike(post.id)}
                disabled={processingLikeId === post.id}
            >
              <Heart className={cn("w-4 h-4", processingLikeId === post.id ? "animate-ping" : post.likesCount > 0 && "fill-current")} />
              <span className="font-bold text-xs">{post.likesCount || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 rounded-xl h-10">
              <MessageCircle className="w-4 h-4" />
              <span className="font-bold text-xs">Commenter</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 rounded-xl h-10">
              <Share2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}