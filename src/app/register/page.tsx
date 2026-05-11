
'use client';

import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RegisterContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const queryStr = refCode ? `?ref=${refCode}` : '';

  return (
    <AuthCard
      title="Rejoignez Loving"
      description="Choisissez votre rôle pour commencer votre aventure."
      footerContent={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Se connecter
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/register/admin" className="hover:underline">
              Inscription Administrateur
            </Link>
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <Link href={`/register/woman${queryStr}`} passHref>
          <Button variant="secondary" className="w-full h-24 flex flex-col gap-2">
            <span className="text-lg font-semibold">Je suis une Femme</span>
            <span className="font-normal text-muted-foreground">Créez votre profil et acceptez des rendez-vous.</span>
          </Button>
        </Link>
        <Link href={`/register/man${queryStr}`} passHref>
          <Button variant="secondary" className="w-full h-24 flex flex-col gap-2">
            <span className="text-lg font-semibold">Je suis un Homme</span>
            <span className="font-normal text-muted-foreground">Proposez des rendez-vous exclusifs.</span>
          </Button>
        </Link>
      </div>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
