
'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { Rendezvous } from '@/types/rendezvous';
import { AdminValidationCard } from '@/components/admin-validation-card';
import { AdminValidationCardSkeleton } from '@/components/admin-validation-card-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';
import { validateRendezvousProof } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';

export default function AdminValidationsPage() {
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const { toast } = useToast();

  const validationsQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(
      collection(firestore, 'rendezvous'),
      where('selfieValidationStatus', '==', 'pending'),
      orderBy('updatedAt', 'asc')
    );
  }, [firestore, userProfile]);

  const { data: validations, loading, error } = useCollection<Rendezvous>(validationsQuery);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const handleValidation = async (rendezvousId: string, approved: boolean) => {
    if (!firestore) return;
    setProcessingId(rendezvousId);
    try {
        await validateRendezvousProof({ firestore, rendezvousId, approved });
        toast({
            title: 'Validation effectuée',
            description: `Le rendez-vous a été ${approved ? 'approuvé' : 'rejeté'}.`,
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Erreur de validation',
            description: e.message || 'Une erreur est survenue.',
        });
    } finally {
        setProcessingId(null);
    }
  }

  if (userProfile?.role !== 'admin' && !loading) {
      return <div className="p-8">Accès restreint.</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Validations en Attente</h1>
        <p className="text-muted-foreground mt-1">Validez ou rejetez les selfies de preuve des rendez-vous.</p>
      </header>
      
      {error && (
        <div className="text-center py-10 px-4 rounded-md border border-destructive bg-destructive/10 text-destructive-foreground">
          <h3 className="font-semibold">Une erreur est survenue</h3>
          <p className="text-sm">Impossible de charger les validations pour le moment. Veuillez réessayer plus tard.</p>
        </div>
      )}

      <div className="space-y-6">
        {loading && Array.from({ length: 2 }).map((_, i) => <AdminValidationCardSkeleton key={i} />)}
        
        {!loading && validations?.map((rendezvous) => (
          <AdminValidationCard 
            key={rendezvous.id} 
            rendezvous={rendezvous} 
            onValidate={handleValidation}
            isProcessing={processingId === rendezvous.id}
          />
        ))}
      </div>

       {!loading && validations?.length === 0 && (
         <div className="py-10 px-4">
            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Aucune validation en attente</AlertTitle>
                <AlertDescription>
                    Il n'y a actuellement aucun selfie de rendez-vous à valider.
                </AlertDescription>
            </Alert>
        </div>
       )}
    </div>
  );
}
