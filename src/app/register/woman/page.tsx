
'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AiBioAssistantForm } from '@/components/ai-bio-assistant-form';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { signUpAndCreateProfile } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  email: z.string().email('Adresse e-mail invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  birthDate: z.string().refine((date) => {
    if (!date) return false;
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, 'Vous devez avoir au moins 18 ans.'),
  city: z.string().min(2, 'La ville est requise.'),
  whatsappNumber: z.string().min(8, 'Le numéro WhatsApp est requis.'),
  maritalStatus: z.string().min(1, 'La situation matrimoniale est requise.'),
  bio: z.string().min(200, 'La biographie doit contenir au moins 200 caractères.'),
  mainPhoto: z.any().optional(),
});

function RegisterWomanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const referredBy = searchParams.get('ref');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      birthDate: '',
      city: '',
      whatsappNumber: '',
      maritalStatus: '',
      bio: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { mainPhoto, ...data } = values;
      await signUpAndCreateProfile({
        auth,
        firestore,
        storage,
        role: 'woman',
        data,
        photoFile: mainPhoto?.[0],
        referredByCode: referredBy,
      });

      toast({
        title: 'Inscription réussie !',
        description: 'Bienvenue sur Loving ! Préparation de votre profil...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: "Erreur d'inscription",
        description: error.message || 'Une erreur est survenue.',
      });
    }
  }

  return (
    <AuthCard
      title="Inscription Femme"
      description="Créez votre profil pour commencer à recevoir des propositions."
      footerContent={
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
      className="max-w-4xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="votre@email.com" {...field} disabled={isLoading} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de naissance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isLoading} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville de résidence</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cotonou" {...field} disabled={isLoading} className="rounded-xl" />
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
                  <FormLabel>Numéro WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: +229 01XXXXXXXX" {...field} disabled={isLoading} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situation Matrimoniale</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sélectionnez..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="Célibataire">Célibataire</SelectItem>
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
              name="mainPhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo de profil</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        field.onChange(e.target.files);
                      }}
                      disabled={isLoading} 
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
             <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biographie (Min. 200 caractères)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Parlez de vous, de vos passions..."
                        className="min-h-[120px] rounded-2xl"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <AiBioAssistantForm mainForm={form} />
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Création du profil...' : 'Finaliser mon inscription'}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

export default function RegisterWomanPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <RegisterWomanForm />
    </Suspense>
  );
}
