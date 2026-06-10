'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase ecosystem with strict session-only persistence.
 * Note: If you were previously logged in with 'local' persistence, you must 
 * sign out once manually to clear the cached token from your browser storage.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  if (typeof window !== 'undefined') {
    // Enforce session-only persistence for security in preview and production environments
    setPersistence(auth, browserSessionPersistence).catch(() => {
      // Persistence setting failure is non-critical for basic auth flow
    });
  }

  return { app, db, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
