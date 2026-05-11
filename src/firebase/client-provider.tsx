'use client';

import React from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';
import { UserProvider } from './auth/use-user';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebase = initializeFirebase();
  return (
    <FirebaseProvider value={firebase}>
      <UserProvider>{children}</UserProvider>
    </FirebaseProvider>
  );
}
