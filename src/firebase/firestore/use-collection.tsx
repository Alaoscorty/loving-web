
'use client';
import type {
  Query,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useMemoFirebase } from '@/lib/use-memo-firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const memoizedQuery = useMemoFirebase(query);
  
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snap) => {
        const docs = snap.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(docs);
        setError(null);
        setLoading(false);
      },
      async (serverError: any) => {
        // Ignorer les erreurs internes de Firestore qui peuvent survenir pendant le rechargement à chaud
        if (serverError.message?.includes('INTERNAL ASSERTION FAILED')) {
          return;
        }

        // Ne rapporter une erreur de permission que si c'est réellement le cas
        if (serverError.code === 'permission-denied') {
            const path = (memoizedQuery as any)._query?.path?.segments?.join('/') || 'collection';
            const permissionError = new FirestorePermissionError({
              path: path,
              operation: 'list',
            } satisfies SecurityRuleContext);

            errorEmitter.emit('permission-error', permissionError);
            setError(permissionError);
        } else {
            // Autres erreurs (index manquant, etc.)
            console.error("Firestore Query Error:", serverError);
            setError(serverError);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, error, loading };
}
