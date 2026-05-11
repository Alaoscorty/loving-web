'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/types/user';
import { useDoc } from '../firestore/use-doc';
import { LoadingScreen } from '@/components/loading-screen';

type UserContextValue = {
  user: User | null;
  userProfile: (UserProfile & {id: string}) | undefined | null;
  loading: boolean;
  activeProfileId: string | null;
  switchProfile: (profileId: string) => void;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  userProfile: null,
  loading: true,
  activeProfileId: null,
  switchProfile: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
          const savedProfileId = localStorage.getItem(`active_profile_${user.uid}`);
          setActiveProfileId(savedProfileId || user.uid);
      } else {
          setActiveProfileId(null);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const switchProfile = (profileId: string) => {
      if (user) {
          setIsSwitching(true);
          localStorage.setItem(`active_profile_${user.uid}`, profileId);
          setActiveProfileId(profileId);
          setTimeout(() => setIsSwitching(false), 800);
      }
  }

  const userDocRef = user && activeProfileId ? doc(firestore, 'users', activeProfileId) : (user ? doc(firestore, 'users', user.uid) : null);
  const { data: userProfile, loading: loadingProfile } = useDoc<UserProfile>(userDocRef);

  // On considère comme "en chargement" si Auth n'a pas répondu OU si on a un user mais pas encore son profil
  const loading = loadingUser || (!!user && loadingProfile) || isSwitching;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <UserContext.Provider value={{ user, userProfile, loading, activeProfileId, switchProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
