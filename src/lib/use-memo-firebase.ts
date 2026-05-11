
'use client';
import { useMemo, useRef } from 'react';
import {
  Query,
  DocumentReference,
  queryEqual,
  refEqual,
} from 'firebase/firestore';

/**
 * Hook pour stabiliser les références et requêtes Firebase.
 * Accepte une valeur directe, pas une fonction.
 */
export function useMemoFirebase<
  T extends DocumentReference<any> | Query<any> | null | undefined
>(value: T): T {
  const lastRef = useRef<T>(null);

  return useMemo(() => {
    if (!value) {
      lastRef.current = null;
      return null as T;
    }

    const current = lastRef.current;

    if (current) {
      try {
        // @ts-ignore
        const isDoc = value.type === 'document';
        // @ts-ignore
        const isQuery = value.type === 'query';

        if (isDoc && (current as any).type === 'document') {
          if (refEqual(value as DocumentReference, current as DocumentReference)) {
            return current;
          }
        } else if (isQuery && (current as any).type === 'query') {
          if (queryEqual(value as Query, current as Query)) {
            return current;
          }
        }
      } catch (e) {}
    }

    lastRef.current = value;
    return value;
  }, [value]);
}
