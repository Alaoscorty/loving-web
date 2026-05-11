import { MessageCircle } from 'lucide-react';

export function NoConversationSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/50">
      <div className="text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Sélectionnez une conversation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez une conversation dans la liste pour commencer à discuter.
        </p>
      </div>
    </div>
  );
}
