'use client';

import { MessagesView } from '@/components/dashboard/messages-view';

/**
 * Page de messagerie principale.
 * Elle utilise le composant MessagesView pour maintenir une cohérence visuelle
 * avec la vue intégrée dans le tableau de bord (Home).
 */
export default function MessagesPage() {
  return (
    <div className="flex flex-col h-[calc(100vh_-_theme(spacing.16))] p-2 md:p-6 lg:p-10 overflow-hidden">
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col h-full">
        <header className="mb-6 px-1 shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-headline text-primary">Conversations</h1>
            <p className="text-muted-foreground text-sm">Gérez vos échanges, stories et appels sécurisés.</p>
        </header>
        
        <div className="flex-1 min-h-0">
            <MessagesView />
        </div>
      </div>
    </div>
  );
}
