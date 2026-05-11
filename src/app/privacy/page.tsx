'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Button>
        </Link>

        <header className="space-y-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter">Politique de Confidentialité</h1>
          <p className="text-muted-foreground italic">Dernière mise à jour : 21 Février 2024</p>
        </header>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Collecte des données</h2>
            <p>Nous collectons les informations que vous nous fournissez directement : nom, email, date de naissance, ville, biographie et photos. Ces données sont nécessaires pour créer votre profil et vous permettre d'interagir avec les autres membres.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Afficher votre profil aux autres membres selon votre rôle.</li>
              <li>Gérer vos rendez-vous et vos transactions financières.</li>
              <li>Assurer la sécurité de la plateforme via les validations par selfie.</li>
              <li>Améliorer votre expérience via nos assistants IA.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Partage des données</h2>
            <p>Loving ne vend jamais vos données personnelles à des tiers. Vos informations ne sont visibles que par les membres inscrits sur la plateforme.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Géolocalisation</h2>
            <p>Nous utilisons votre position uniquement lors de la validation d'un rendez-vous réel pour garantir que la rencontre a bien lieu au lieu convenu.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
