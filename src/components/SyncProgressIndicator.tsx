'use client';

import { useEffect, useState } from 'react';
import { syncService, type SyncUpdate } from '@/lib/sync-service';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function SyncProgressIndicator() {
  const [state, setState] = useState<SyncUpdate>(syncService.getState());

  useEffect(() => {
    return syncService.subscribe(setState);
  }, []);

  if (state.status === 'idle') return null;

  const progressValue = isNaN(state.progress) ? 0 : state.progress;

  return (
    <div className="fixed bottom-6 left-6 z-[100] animate-in slide-in-from-left-4 duration-500">
      <div className={cn(
        "w-72 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all",
        state.status === 'error' ? "bg-destructive/10 border-destructive/20" : "bg-black/60 border-white/10"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {state.status === 'syncing' && <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />}
            {state.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
            {state.status === 'error' && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
            <span className="text-xs font-bold uppercase tracking-widest truncate">
              {state.status === 'syncing' ? 'Vault Syncing' : state.status === 'success' ? 'Sync Stabilized' : 'Sync Error'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-white/5"
            onClick={() => syncService.reset()}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end text-[10px] font-mono text-muted-foreground">
            <span className="truncate flex-1 pr-2">{state.message || 'Processing nodes...'}</span>
            <span className="shrink-0">{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-1.5 bg-white/5" />
          {state.count !== undefined && state.count > 0 && (
            <p className="text-[9px] text-primary/60 font-medium uppercase tracking-tighter mt-1">
              {state.count} nodes detected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
