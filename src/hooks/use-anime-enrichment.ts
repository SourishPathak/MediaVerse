'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { fetchAnimeEnrichment } from '@/lib/jikan-service';

/**
 * @fileOverview Background metadata enrichment service for anime archives.
 * Manages the transition of media nodes from a pending state to a stabilized archival state
 * by retrieving supplemental data from the Jikan API.
 */

export function useAnimeEnrichment() {
  const { user } = useUser();
  const db = useFirestore();
  const isProcessing = useRef(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const pendingQuery = useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'users', user.uid, 'media'),
      where('posterStatus', '==', 'pending'),
      limit(10)
    );
  }, [db, user?.uid, retryTrigger]);

  const { data: pendingItems = [] } = useCollection(pendingQuery);

  useEffect(() => {
    const interval = setInterval(() => {
      setRetryTrigger(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!db || !user?.uid || pendingItems.length === 0 || isProcessing.current) return;

    async function runBatch() {
      isProcessing.current = true;

      try {
        for (const item of pendingItems as any[]) {
          try {
            if (!item.platformId) {
              const ref = doc(db, 'users', user.uid, 'media', item.id);
              await updateDoc(ref, { posterStatus: 'failed' });
              continue;
            }

            const enrichment = await fetchAnimeEnrichment(item.platformId);
            const mediaRef = doc(db, 'users', user.uid, 'media', item.id);
            
            if (!enrichment) {
              await updateDoc(mediaRef, { posterStatus: 'failed' });
              continue;
            }

            await updateDoc(mediaRef, {
              imageUrl: enrichment.posterUrl,
              largePosterUrl: enrichment.largePosterUrl,
              synopsis: enrichment.synopsis,
              genres: enrichment.genres,
              posterStatus: 'completed',
              updatedAt: serverTimestamp()
            });

            await new Promise(r => setTimeout(r, 1500));
          } catch (itemErr) {
            const mediaRef = doc(db, 'users', user.uid, 'media', item.id);
            updateDoc(mediaRef, { posterStatus: 'failed' }).catch(() => {});
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