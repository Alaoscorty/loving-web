import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

export function getServerFirestore() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}
