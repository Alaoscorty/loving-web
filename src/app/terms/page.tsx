'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Button>
        </Link>

        <header className="space-y-4">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter">Conditions d'Utilisation</h1>
          <p className="text-muted-foreground italic">Veuillez lire attentivement ces conditions avant d'utiliser Loving.</p>
        </header>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Éligibilité</h2>
            <p>Vous devez avoir au moins 18 ans pour vous inscrire sur Loving. En créant un compte, vous garantissez l'exactitude des informations fournies.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Code de conduite</h2>
            <p>Loving prône le respect mutuel. Sont strictement interdits :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le harcèlement ou les propos haineux.</li>
              <li>La nudité explicite dans les photos publiques.</li>
              <li>Les tentatives d'arnaque ou de fraude financière.</li>
              <li>Le non-respect répété des rendez-vous acceptés.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Système financier</h2>
            <p>Toute transaction financière (retrait de points) est soumise à une commission de 20% pour frais de service. Les points XP gagnés n'ont de valeur que dans le cadre des règles de retrait fixées par Loving.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Suppression de compte</h2>
            <p>Loving se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces conditions, sans préavis.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
