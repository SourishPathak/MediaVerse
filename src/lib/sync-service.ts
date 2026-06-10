
'use client';

/**
 * @fileOverview A robust observable service for tracking global sync progress across the vault.
 * Ensures synchronization state remains visible and accurate during background archival.
 */

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type SyncUpdate = {
  progress: number;
  status: SyncStatus;
  message?: string;
  count?: number;
};

type Listener = (update: SyncUpdate) => void;
const listeners = new Set<Listener>();

let state: SyncUpdate = { progress: 0, status: 'idle' };

export const syncService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(state); // Initial call
    return () => listeners.delete(listener);
  },
  update(update: Partial<SyncUpdate>) {
    state = { ...state, ...update };
    listeners.forEach(l => l(state));
  },
  getState() {
    return state;
  },
  reset() {
    state = { progress: 0, status: 'idle', message: '', count: 0 };
    listeners.forEach(l => l(state));
  }
};
