
'use client';

import { useMemo } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

export function InvitedPostsFeed() {
  const firestore = useFirestore();
  const { user, userProfile } = useUser();

  // 1. Récupérer les rendez-vous envoyés par cet homme
  const rendezvousQuery = useMemo(() => {
    if (!firestore || !user || userProfile?.role !== 'man') return null;
    return query(collection(firestore, 'rendezvous'), where('manUid', '==', user.uid));
  }, [firestore, user, userProfile]);

  const { data: rendezvous, loading: loadingRdv } = useCollection<any>(rendezvousQuery);

  // 2. Extraire les IDs des femmes invitées
  const invitedWomanIds = useMemo(() => {
    if (!rendezvous) return [];
    return Array.from(new Set(rendezvous.map((r: any) => r.womanUid))).filter(id => id !== 'SYSTEM');
  }, [rendezvous]);

  // 3. Récupérer les posts de ces femmes (sans tri serveur pour éviter l'erreur d'index)
  const invitedPostsQuery = useMemo(() => {
    if (!firestore || invitedWomanIds.length === 0) return null;
    // On retire l'orderBy côté serveur pour éviter l'erreur d'index composite
    return query(
      collection(firestore, 'posts'),
      where('creatorUid', 'in', invitedWomanIds.slice(0, 30)),
      limit(50) // On en prend un peu plus pour trier proprement côté client
    );
  }, [firestore, invitedWomanIds]);

  const { data: rawPosts, loading: loadingPosts } = useCollection<any>(invitedPostsQuery);

  // 4. Tri et limitation côté client
  const posts = useMemo(() => {
    if (!rawPosts) return [];
    return [...rawPosts]
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 10);
  }, [rawPosts]);

  if (userProfile?.role !== 'man') return null;
  if (loadingRdv || loadingPosts) return <Skeleton className="h-48 w-full rounded-[2rem]" />;
  if (!posts || posts.length === 0) return null;

  return (
    <section className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 px-1">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Actualités de vos rencontres</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {posts.map((post) => (
          <Card key={post.id} className="min-w-[280px] max-w-[280px] overflow-hidden rounded-[2rem] border-none shadow-lg bg-card/40 backdrop-blur-sm relative group">
            <div className="relative aspect-square">
                {post.imageUrl ? (
                    <Image src={post.imageUrl} alt="Post" fill className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-primary/5 flex items-center justify-center p-6 text-center text-xs italic">
                        "{post.text}"
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white/20">
                        <AvatarImage src={post.creatorPhotoUrl} />
                        <AvatarFallback>{post.creatorName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-white text-xs font-bold truncate">{post.creatorName}</p>
                        <p className="text-white/60 text-[9px] uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                    </div>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
