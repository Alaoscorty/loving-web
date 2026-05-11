'use client';

import { Icons } from '@/components/icons';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Empêche le rendu côté serveur pour éviter les erreurs d'hydratation
  // Le client prendra le relais après le montage initial
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="relative">
        {/* Animation de l'anneau */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        <div className="relative bg-background p-8 rounded-full shadow-2xl border border-primary/10">
          <Icons.logo className="h-16 w-16 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold font-headline tracking-tighter text-foreground">Loving</h2>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
        </div>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] animate-pulse">Chargement de votre univers</p>
      </div>
    </div>
  );
}
