'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { fetchMoviePosterPlaceholder } from '@/actions/movie-actions';

/**
 * @fileOverview Background metadata enrichment service for cinematic archives.
 * Processes movie records to ensure deterministic visual styling and metadata consistency
 * across the user's private media vault.
 */

export function useMovieEnrichment() {
  const { user } = useUser();
  const db = useFirestore();
  const isProcessing = useRef(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const pendingQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'users', user.uid, 'movies'),
      where('posterStatus', '==', 'pending'),
      limit(20)
    );
  }, [db, user?.uid, retryTrigger]);

  const { data: pendingItems = [] } = useCollection(pendingQuery);

  useEffect(() => {
    if (!db || !user?.uid || pendingItems.length === 0 || isProcessing.current) return;

    async function runBatch() {
      isProcessing.current = true;
      
      try {
        for (const item of pendingItems as any[]) {
          try {
            const placeholder = await fetchMoviePosterPlaceholder(item.title, item.year);
            const movieRef = doc(db, 'users', user.uid, 'movies', item.id);
            
            await updateDoc(movieRef, {
              imageUrl: placeholder.posterUrl || null,
              largePosterUrl: placeholder.largePosterUrl || null,
              synopsis: placeholder.synopsis || `A cinematic entry for "${item.title}".`,
              genres: ['Film'],
              themeColor: placeholder.themeColor,
              posterStatus: 'completed',
              updatedAt: serverTimestamp()
            });
          } catch (itemErr) {
            const movieRef = doc(db, 'users', user.uid, 'movies', item.id);
            updateDoc(movieRef, { posterStatus: 'failed' }).catch(() => {});
          }
        }
      } finally {
        isProcessing.current = false;
        setRetryTrigger(prev => prev + 1);
      }
    }

    runBatch();
  }, [pendingItems, db, user?.uid]);
}
