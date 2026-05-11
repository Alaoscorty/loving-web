
'use client';
import type {
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useMemoFirebase } from '@/lib/use-memo-firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const memoizedRef = useMemoFirebase(ref);
  
  const [data, setData] = useState<(T & { id: string }) | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!memoizedRef) {
      setData(undefined);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedRef,
      (snap) => {
        if (snap.exists()) {
          setData({ ...(snap.data() as T), id: snap.id });
        } else {
          setData(undefined);
        }
        setError(null);
        setLoading(false);
      },
      async (serverError) => {
        if (serverError.message?.includes('INTERNAL ASSERTION FAILED')) {
          return;
        }

        const permissionError = new FirestorePermissionError({
          path: memoizedRef.path,
          operation: 'get',
        });

        errorEmitter.emit('permission-error', permissionError);

        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedRef]);

  return { data, error, loading };
}
