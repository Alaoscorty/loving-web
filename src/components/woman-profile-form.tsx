
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Phone, Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AiBioAssistantForm } from '@/components/ai-bio-assistant-form';
import { useFirestore, useStorage } from '@/firebase';
import { updateUserProfile } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  city: z.string().min(2, 'La ville est requise.'),
  whatsappNumber: z.string().min(8, 'Le numéro WhatsApp est requis.'),
  maritalStatus: z.string().min(1, 'La situation matrimoniale est requise.'),
  bio: z.string().min(200, 'La biographie doit contenir au moins 200 caractères.'),
  profilePhoto: z.any().optional(),
  hobbies: z.string().optional(),
  profession: z.string().optional(),
  situationFamiliale: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Props = {
  userProfile: UserProfile & { id: string };
};

export function WomanProfileForm({ userProfile }: Props) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photoUrl || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile.name || '',
      city: userProfile.city || '',
      whatsappNumber: userProfile.whatsappNumber || '',
      maritalStatus: userProfile.maritalStatus || '',
      bio: userProfile.bio || '',
      hobbies: userProfile.hobbies?.join(', ') || '',
      profession: userProfile.profession || '',
      situationFamiliale: userProfile.situationFamiliale || '',
    },
  });

  useEffect(() => {
      if (userProfile) {
          setPhotoPreview(userProfile.photoUrl || null);
          form.reset({
            name: userProfile.name || '',
            city: userProfile.city || '',
            whatsappNumber: userProfile.whatsappNumber || '',
            maritalStatus: userProfile.maritalStatus || '',
            bio: userProfile.bio || '',
            hobbies: userProfile.hobbies?.join(', ') || '',
            profession: userProfile.profession || '',
            situationFamiliale: userProfile.situationFamiliale || '',
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
      const { profilePhoto, hobbies, ...rest } = values;
      
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
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur de mise à jour',
        description: error.message || 'Une erreur est survenue.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="rounded-[2rem] border-none bg-card/40 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Mon Identité</CardTitle>
            <CardDescription>Ces informations aident les hommes à mieux vous connaître.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="profilePhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de profil</FormLabel>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarImage src={photoPreview || undefined} alt={userProfile.name} className="object-cover" />
                            <AvatarFallback>{userProfile.name?.[0].toUpperCase()}</AvatarFallback>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                            <Input placeholder="Votre nom" {...field} disabled={isLoading} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2">WhatsApp <Phone className="w-3 h-3 text-green-500" /></FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: +229 01XXXXXXXX" {...field} disabled={isLoading} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">Situation Matrimoniale <Heart className="w-3 h-3 text-primary" /></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Sélectionnez..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Célibataire">Célibataire</SelectItem>
                                    <SelectItem value="En couple">En couple</SelectItem>
                                    <SelectItem value="Mariée">Mariée</SelectItem>
                                    <SelectItem value="Divorcée">Divorcée</SelectItem>
                                    <SelectItem value="Veuve">Veuve</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Cotonou" {...field} disabled={isLoading} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Infirmière, Business Woman..." {...field} disabled={isLoading} className="rounded-xl" />
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
                    <FormLabel>Hobbies & Intérêts (séparés par des virgules)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Voyage, Cuisine, Danse" {...field} disabled={isLoading} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none bg-card/40 backdrop-blur-md shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Biographie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Votre biographie détaillée</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Votre biographie d'au moins 200 caractères."
                            className="min-h-[150px] rounded-2xl"
                            {...field}
                            disabled={isLoading}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <AiBioAssistantForm mainForm={form} />
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="h-14 px-10 rounded-2xl font-bold shadow-xl shadow-primary/20">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder les modifications
            </Button>
        </div>
      </form>
    </Form>
  );
}
