
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Camera } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useStorage } from '@/firebase';
import { updateUserProfile } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  bio: z.string().optional(),
  profession: z.string().optional(),
  hobbies: z.string().optional(),
  profilePhoto: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Props = {
  userProfile: UserProfile & { id: string };
};

export function ManProfileForm({ userProfile }: Props) {
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photoUrl || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile.name || '',
      bio: userProfile.bio || '',
      profession: userProfile.profession || '',
      hobbies: userProfile.hobbies?.join(', ') || '',
    },
  });

  useEffect(() => {
    if (userProfile) {
        setPhotoPreview(userProfile.photoUrl || null);
        form.reset({
            name: userProfile.name || '',
            bio: userProfile.bio || '',
            profession: userProfile.profession || '',
            hobbies: userProfile.hobbies?.join(', ') || '',
        });
    }
  }, [userProfile, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true);
    try {
      const { hobbies, profilePhoto, ...rest } = values;
      
      const dataToUpdate: Partial<UserProfile> = {
        ...rest,
        hobbies: hobbies?.split(',').map(s => s.trim()).filter(Boolean),
      };

      await updateUserProfile({
        firestore,
        storage,
        userId: userProfile.uid,
        data: dataToUpdate,
        photoFile: profilePhoto?.[0],
      });

      toast({
        title: 'Profil mis à jour !',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="rounded-3xl border-none bg-card/40 backdrop-blur-md shadow-xl border border-white/5">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Éditer mon profil</CardTitle>
            <CardDescription>Mettez à jour vos informations pour attirer plus d'attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="profilePhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de profil</FormLabel>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                            <AvatarImage src={photoPreview || undefined} alt={userProfile.name} className="object-cover" />
                            <AvatarFallback className="font-bold text-2xl">{userProfile.name?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                disabled={isLoading}
                                className="rounded-xl"
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handlePhotoChange(e);
                                }}
                            />
                        </FormControl>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom Complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom" {...field} disabled={isLoading} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Architecte, Entrepreneur..." {...field} disabled={isLoading} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Passions (séparées par des virgules)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Tennis, Gastronomie, Jazz" {...field} disabled={isLoading} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Présentation rapide</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Dites-en un peu plus sur vous..."
                        className="min-h-[100px] rounded-xl"
                        {...field}
                        disabled={isLoading}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="h-12 px-10 rounded-full font-bold shadow-lg shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder les changements
            </Button>
        </div>
      </form>
    </Form>
  );
}
