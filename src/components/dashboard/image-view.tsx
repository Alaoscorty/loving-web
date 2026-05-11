
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useStorage } from '@/firebase';
import { updateUserProfile, uploadSecondaryPhoto, deleteSecondaryPhoto } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Sparkles, AlertCircle, Plus, Trash2, ImageIcon, Info, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { isAfter, subMonths } from 'date-fns';

type Props = {
  userProfile: UserProfile & { id: string };
};

export function ImageView({ userProfile }: Props) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [isUpdatingMain, setIsUpdatingMain] = useState(false);
  const [isUploadingSecondary, setIsUploadingSecondary] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sync avec Firestore si les données changent
  useEffect(() => {
      if (userProfile) {
          setPhotoPreview(userProfile.photoUrl || null);
      }
  }, [userProfile.photoUrl]);

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMainPhoto = async () => {
    if (!selectedFile) return;
    setIsUpdatingMain(true);
    try {
      await updateUserProfile({
        firestore,
        storage,
        userId: userProfile.uid,
        data: {},
        photoFile: selectedFile,
      });
      toast({ title: 'Photo principale mise à jour !' });
      setSelectedFile(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } finally {
      setIsUpdatingMain(false);
    }
  };

  const handleAddSecondaryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !firestore || !storage) return;
      
      setIsUploadingSecondary(true);
      try {
          await uploadSecondaryPhoto({ firestore, storage, userId: userProfile.uid, file });
          toast({ title: 'Photo ajoutée à votre galerie !' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      } finally {
          setIsUploadingSecondary(false);
      }
  }

  const handleDeleteSecondary = async (url: string) => {
      if (!firestore || !storage) return;
      try {
          await deleteSecondaryPhoto({ firestore, storage, userId: userProfile.uid, photoUrl: url });
          toast({ title: 'Photo supprimée.' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur lors de la suppression.' });
      }
  }

  // Filtrer les photos de moins de 5 mois
  const activePhotos = useMemo(() => {
      const fiveMonthsAgo = subMonths(new Date(), 5);
      return (userProfile.secondaryPhotos || []).filter(photo => {
          if (!photo.createdAt) return true; // Legacy support
          return isAfter(new Date(photo.createdAt), fiveMonthsAgo);
      });
  }, [userProfile.secondaryPhotos]);

  const expiredCount = (userProfile.secondaryPhotos?.length || 0) - activePhotos.length;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <Card className="rounded-[2.5rem] border-none bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
        <CardHeader className="text-center bg-muted/30 pb-10">
          <CardTitle className="font-headline text-3xl tracking-tighter">Photo de Profil</CardTitle>
          <CardDescription>Votre identité principale sur Loving.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center -mt-12">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                <Avatar className="h-48 w-48 border-8 border-background shadow-2xl relative">
                    <AvatarImage src={photoPreview || undefined} className="object-cover" />
                    <AvatarFallback className="text-5xl font-bold bg-muted">{userProfile.name[0]}</AvatarFallback>
                </Avatar>
                <label className="absolute bottom-2 right-2 p-4 bg-primary text-white rounded-full cursor-pointer shadow-xl hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleMainPhotoChange} disabled={isUpdatingMain} />
                </label>
            </div>
            
            <div className="mt-8">
                {selectedFile && (
                    <Button onClick={handleUpdateMainPhoto} disabled={isUpdatingMain} className="rounded-full px-8">
                        {isUpdatingMain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Sauvegarder la photo principale
                    </Button>
                )}
            </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
            <div className="space-y-1">
                <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                    <ImageIcon className="text-primary w-6 h-6" /> Galerie Secondaire
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Durée de vie : 5 mois
                </p>
            </div>
            <label className="h-12 px-6 bg-primary text-white rounded-2xl flex items-center gap-2 font-bold cursor-pointer hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                {isUploadingSecondary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ajouter une photo
                <input type="file" className="hidden" accept="image/*" onChange={handleAddSecondaryPhoto} disabled={isUploadingSecondary} />
            </label>
        </div>

        {expiredCount > 0 && (
            <div className="px-4">
                <Alert className="bg-muted/50 border-none rounded-2xl">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs italic">
                        {expiredCount} photo{expiredCount > 1 ? 's' : ''} on{expiredCount > 1 ? 't' : 'a'} été masquée{expiredCount > 1 ? 's' : ''} car elles datent de plus de 5 mois.
                    </AlertDescription>
                </Alert>
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {activePhotos.map((photo, i) => (
                <div key={i} className="group relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl bg-card border border-white/5">
                    <Image src={photo.url} alt={`Photo ${i}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="rounded-full h-12 w-12 shadow-2xl"
                            onClick={() => handleDeleteSecondary(photo.url)}
                        >
                            <Trash2 className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            ))}
            
            {activePhotos.length === 0 && (
                <div className="col-span-full py-20 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-bold">Votre galerie est vide</p>
                    <p className="text-xs max-w-xs text-center mt-1">Ajoutez des photos pour captiver l'attention. Elles seront visibles pendant 150 jours.</p>
                </div>
            )}
        </div>
      </section>
    </div>
  );
}
