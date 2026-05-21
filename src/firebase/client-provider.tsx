'use client';

import React, { useEffect } from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';
import { browserLocalPersistence, setPersistence } from 'firebase/auth';
import { UserProvider } from './auth/use-user';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebase = initializeFirebase();

  useEffect(() => {
    setPersistence(firebase.auth, browserLocalPersistence).catch((error) => {
      console.error('Firebase auth persistence failed:', error);
    });
  }, [firebase.auth]);

  return (
    <FirebaseProvider value={firebase}>
      <UserProvider>{children}</UserProvider>
    </FirebaseProvider>
  );
}
