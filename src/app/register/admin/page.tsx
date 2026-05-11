'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { signUpAndCreateProfile } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Le nom est requis.'),
  email: z.string().email('Adresse e-mail invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  secretCode: z.string().refine((code) => code === 'ALAO716', {
    message: 'Code secret incorrect.',
  }),
});

export default function RegisterAdminPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      secretCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { secretCode, ...data } = values;
      await signUpAndCreateProfile({
        auth,
        firestore,
        storage,
        role: 'admin',
        data,
      });

      toast({
        title: 'Compte Admin créé !',
        description: 'Le compte administrateur a été créé avec succès.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Erreur d'inscription",
        description: error.message || 'Une erreur est survenue.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Inscription Administrateur"
      description="Accès réservé aux administrateurs de la plateforme."
      footerContent={
        <p className="text-center text-sm text-muted-foreground">
          Retour à{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            la connexion
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
                  <Input placeholder="Votre nom" {...field} disabled={isLoading}/>
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
                  <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secretCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Secret</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Code d'accès" {...field} disabled={isLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le compte Administrateur
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
