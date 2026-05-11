'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Heart, ShieldCheck, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Button>
        </Link>

        <header className="text-center space-y-6">
          <Icons.logo className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-5xl font-bold font-headline tracking-tighter">L'Histoire de Loving</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Plus qu'une application, un club privé pour des rencontres d'exception.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-[2.5rem] border space-y-4 shadow-xl">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">Notre Mission</h3>
                <p className="text-sm text-muted-foreground">Remettre l'élégance et le respect au cœur des rencontres en ligne en Afrique.</p>
            </div>
            <div className="p-8 bg-card rounded-[2.5rem] border space-y-4 shadow-xl">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">Sécurité</h3>
                <p className="text-sm text-muted-foreground">Un environnement 100% vérifié où chaque rendez-vous est sécurisé par selfie et QR code.</p>
            </div>
            <div className="p-8 bg-card rounded-[2.5rem] border space-y-4 shadow-xl">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">Communauté</h3>
                <p className="text-sm text-muted-foreground">Une sélection de membres exigeants qui valorisent le temps et l'engagement.</p>
            </div>
        </div>

        <section className="space-y-6 text-foreground/80 leading-loose text-lg">
          <p>
            Loving est né d'un constat simple : les plateformes de rencontre traditionnelles manquent souvent de sérieux et de sécurité. Nous avons voulu créer un espace où chaque interaction a une valeur réelle.
          </p>
          <p>
            Sur Loving, les hommes font preuve de courtoisie en proposant des rendez-vous concrets, et les femmes sont libres de choisir les invitations qui leur correspondent le mieux, tout en étant rémunérées pour leur présence et leur fidélité via notre système de points XP.
          </p>
        </section>
      </div>
    </div>
  );
}
