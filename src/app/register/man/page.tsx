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
  profilePhoto: z.any().optional(),
});

function RegisterManForm() {
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { profilePhoto, ...data } = values;
      await signUpAndCreateProfile({
        auth,
        firestore,
        storage,
        role: 'man',
        data,
        photoFile: profilePhoto?.[0],
        referredByCode: referredBy,
      });

      toast({
        title: 'Inscription réussie !',
        description: 'Préparation de votre univers Loving...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      let message = error.message || 'Une erreur est survenue.';
      toast({
        variant: 'destructive',
        title: "Erreur d'inscription",
        description: message,
      });
    }
  }

  return (
    <AuthCard
      title="Inscription Homme"
      description="Créez votre compte pour proposer des rendez-vous."
      footerContent={
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Votre nom" {...field} disabled={isLoading} />
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
                  <Input type="email" placeholder="votre@email.com" {...field} disabled={isLoading}/>
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
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
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
                  <Input type="date" {...field} disabled={isLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profilePhoto"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                    Photo de profil (Optionnel) 
                    <span className="text-[10px] text-muted-foreground font-normal">(Ajoutable plus tard)</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      field.onChange(e.target.files);
                    }}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Création du compte...' : 'Créer mon compte'}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

export default function RegisterManPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <RegisterManForm />
    </Suspense>
  );
}
