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
import { useAuth } from '@/firebase';
import { signInUser } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInUser(auth, values.email, values.password);
      toast({
        title: 'Connexion réussie',
        description: 'Direction votre tableau de bord...',
      });
      // On ne met pas isLoading à false ici car la redirection va prendre le relais
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue.',
      });
    }
  }

  return (
    <AuthCard
      title="Se connecter"
      description="Bienvenue sur Loving. Connectez-vous à votre compte."
      footerContent={
        <p className="text-center text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            S'inscrire
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input placeholder="votre@email.com" {...field} disabled={isLoading} />
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
          <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
