'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useUser, useCollection } from '@/firebase';
import type { Notification } from '@/types/notification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, BellOff, Calendar, Check, MessageSquare, Wallet, CheckCircle2, UserCheck, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase-actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const iconMap = {
  rendezvous_new: <Calendar className="text-primary" />,
  rendezvous_accepted: <CheckCircle2 className="text-green-500" />,
  rendezvous_declined: <BellOff className="text-destructive" />,
  payment_validated: <Wallet className="text-green-500" />,
  payment_rejected: <Wallet className="text-destructive" />,
  selfie_validated: <UserCheck className="text-blue-500" />,
  message_new: <MessageSquare className="text-accent" />,
};

export default function NotificationsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const notificationsQuery = useMemo(() => {
    if (!firestore || !userProfile) return null;
    return query(
      collection(firestore, 'notifications'),
      where('recipientUid', '==', userProfile.uid),
      limit(50)
    );
  }, [firestore, userProfile]);

  const { data: rawNotifications, loading, error } = useCollection<Notification>(notificationsQuery);

  // Tri local pour éviter l'erreur d'index manquant
  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return [...rawNotifications].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rawNotifications]);

  const handleAction = async (notif: Notification) => {
    if (!firestore || !notif.id) return;
    
    // On marque comme lu systématiquement
    if (!notif.isRead) {
        await markNotificationAsRead({ firestore, notificationId: notif.id });
    }

    // On redirige si un lien existe
    if (notif.link) {
        router.push(notif.link);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!firestore) return;
    await markNotificationAsRead({ firestore, notificationId: id });
  };

  const handleMarkAllAsRead = async () => {
      if (!firestore || !userProfile) return;
      setIsMarkingAll(true);
      try {
          await markAllNotificationsAsRead({ firestore, userId: userProfile.uid });
          toast({ title: 'Succès', description: 'Toutes les notifications ont été marquées comme lues.' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
      } finally {
          setIsMarkingAll(false);
      }
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Notifications</h1>
            <p className="text-muted-foreground mt-1">Restez informé de vos activités sur Loving.</p>
        </div>
        {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isMarkingAll}>
                {isMarkingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Tout marquer comme lu
            </Button>
        )}
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>Impossible de charger vos notifications.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardHeader>
            </Card>
          ))
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={cn(
                "transition-colors",
                !notif.isRead ? "bg-primary/5 border-primary/20" : "bg-card"
              )}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="mt-1 p-2 rounded-full bg-background border">
                  {iconMap[notif.type as keyof typeof iconMap] || <Bell className="text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("font-semibold text-sm", !notif.isRead && "text-primary")}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {!notif.isRead && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarkAsRead(notif.id!)}>
                        Marquer comme lu
                      </Button>
                    )}
                    {notif.link && (
                      <Button variant="outline" size="sm" className="h-7 text-xs font-bold" onClick={() => handleAction(notif)}>
                        Voir les détails
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium text-muted-foreground">Aucune notification</h3>
            <p className="text-sm text-muted-foreground">Vous n'avez pas encore reçu d'alertes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
