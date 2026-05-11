'use client';

import { useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { Rendezvous } from '@/types/rendezvous';
import { AdminPaymentCard } from '@/components/admin-payment-card';
import { AdminValidationCardSkeleton } from '@/components/admin-validation-card-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { validatePayment } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();

  const paymentsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(
      collection(firestore, 'rendezvous'),
      where('paymentStatus', '==', 'waiting_validation')
    );
  }, [firestore, userProfile]);

  const { data: rawPayments, loading, error } = useCollection<Rendezvous>(paymentsQuery);
  
  // Tri côté client
  const payments = useMemo(() => {
    if (!rawPayments) return [];
    return [...rawPayments].sort((a, b) => 
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  }, [rawPayments]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const handleValidation = async (rendezvousId: string, approved: boolean) => {
    if (!firestore) return;
    setProcessingId(rendezvousId);
    try {
        await validatePayment({ firestore, rendezvousId, approved });
        toast({
            title: 'Action effectuée',
            description: `Le paiement a été ${approved ? 'validé' : 'rejeté'}.`,
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: e.message || 'Une erreur est survenue.',
        });
    } finally {
        setProcessingId(null);
    }
  }

  if (userProfile?.role !== 'admin') {
      return <div className="p-8 text-muted-foreground">Accès réservé aux administrateurs.</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestion des Paiements</h1>
        <p className="text-muted-foreground mt-1">Validez les captures d'écran des paiements hors ligne (2000 FCFA).</p>
      </header>
      
      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger les paiements.</p>
        </div>
      )}

      <div className="space-y-6">
        {loading && Array.from({ length: 2 }).map((_, i) => <AdminValidationCardSkeleton key={i} />)}
        
        {!loading && payments?.map((rendezvous) => (
          <AdminPaymentCard 
            key={rendezvous.id} 
            rendezvous={rendezvous} 
            onValidate={handleValidation}
            isProcessing={processingId === rendezvous.id}
          />
        ))}
      </div>

       {!loading && payments?.length === 0 && (
         <div className="py-10 px-4">
            <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Tout est à jour</AlertTitle>
                <AlertDescription>
                    Il n'y a actuellement aucun paiement en attente de validation.
                </AlertDescription>
            </Alert>
        </div>
       )}
    </div>
  );
}
