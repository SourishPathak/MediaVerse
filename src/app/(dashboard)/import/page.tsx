
"use client"

import { useState, useMemo } from "react"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { 
  FileUp, 
  History, 
  Archive, 
  Tv, 
  Loader2, 
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Zap
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { doc, serverTimestamp, setDoc, collection, query, orderBy, limit, getDocs, writeBatch } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { syncService } from "@/lib/sync-service"
import { generateCodeVerifier, generateMalAuthUrl } from "@/lib/mal/oauth"

const MAL_CLIENT_ID = process.env.NEXT_PUBLIC_MAL_CLIENT_ID || "";

export default function ImportEnginePage() {
  const { user } = useUser()
  const db = useFirestore()
  const [isProcessing, setIsProcessing] = useState(false)

  const logsQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'sync_logs'), orderBy('timestamp', 'desc'), limit(10))
  }, [db, user?.uid])

  const { data: syncLogs = [], loading: logsLoading } = useCollection(logsQuery)

  const handlePurgeVault = async () => {
    if (!db || !user?.uid) return

    const confirmed = window.confirm("Are you sure you want to purge your entire media vault? This will permanently delete all media nodes, movie archives, and logs.");
    if (!confirmed) return

    setIsProcessing(true)
    syncService.update({ status: 'syncing', progress: 0, message: 'Initializing global purge' })

    try {
      const collectionsToPurge = ['media', 'movies', 'sync_logs'];
      let totalDeletedCount = 0;

      for (const colName of collectionsToPurge) {
        const colRef = collection(db, 'users', user.uid, colName);
        const snap = await getDocs(colRef);
        
        if (snap.empty) continue;

        const docs = snap.docs;
        const totalDocsInCol = docs.length;
        let colDeleted = 0;

        // Firebase Batch limit is 500 operations
        for (let i = 0; i < totalDocsInCol; i += 400) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 400);
          chunk.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          
          colDeleted += chunk.length;
          totalDeletedCount += chunk.length;
          
          const overallProgress = (totalDeletedCount / (totalDocsInCol * collectionsToPurge.length)) * 100;
          syncService.update({ 
            progress: Math.min(overallProgress, 99),
            message: `Cleared ${colDeleted} nodes from ${colName.toUpperCase()}` 
          });
        }
      }

      syncService.update({ status: 'success', progress: 100, message: 'Vault Purged' })
      toast({ title: "Vault Reset", description: `Successfully cleared archival records` })
      setTimeout(() => syncService.reset(), 5000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Purge Failed", description: err.message })
      syncService.update({ status: 'error', message: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMalApiSync = () => {
    if (!MAL_CLIENT_ID) {
      toast({ variant: "destructive", title: "Config Missing", description: "MAL Client ID not detected" })
      return
    }
    const verifier = generateCodeVerifier();
    const { url } = generateMalAuthUrl(MAL_CLIENT_ID, verifier);
    window.location.href = url;
  }

  const handleLetterboxdCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !db || !user?.uid) return

    setIsProcessing(true)
    syncService.update({ status: 'syncing', progress: 0, message: `Analyzing ${file.name}` })

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/)
        const items = []

        // Robust CSV splitter for fields with commas in quotes
        const splitCSV = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const line = splitCSV(lines[i]);
          
          // Index 1 is Name (Title), Index 0 is Date
          const title = line[1]?.replace(/"/g, '').trim();
          if (!title) continue;

          // Index 4 is Rating (based on user image: Date, Name, Year, URI, Rating...)
          const rawRating = parseFloat(line[4]);
          const rating = !isNaN(rawRating) ? rawRating * 2 : 0;

          items.push({
            id: `lb_${title.toLowerCase().replace(/\s+/g, '_')}_${line[0]}`.replace(/[^a-z0-9_]/g, ''),
            title,
            type: 'movie',
            status: 'completed',
            rating,
            watchDate: line[0], // Date logged
            year: line[2]?.replace(/"/g, '') || 'N/A', // Release Year
            platformSource: 'letterboxd',
            posterStatus: 'pending',
            genres: [] // Initialize with empty genres to wait for AI
          });
        }

        if (items.length === 0) throw new Error("No media nodes detected in CSV");

        let processed = 0;
        const total = items.length;
        
        for (const item of items) {
          const movieRef = doc(db, 'users', user.uid, 'movies', item.id);
          setDoc(movieRef, { ...item, updatedAt: serverTimestamp() }, { merge: true }).catch((err) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: movieRef.path, operation: 'write' }));
          });
          
          processed++;
          if (processed % 20 === 0 || processed === total) {
            const progress = (processed / total) * 100;
            syncService.update({ progress: isNaN(progress) ? 0 : progress, message: `Archiving Node ${processed}/${total}` });
          }
        }

        const logRef = doc(collection(db, 'users', user.uid, 'sync_logs'));
        setDoc(logRef, {
          timestamp: new Date().toISOString(),
          provider: 'Letterboxd CSV',
          status: 'success',
          count: total,
          message: `Integrated ${total} movies into cinematic archives`
        });

        syncService.update({ status: 'success', progress: 100, message: 'Vault Synchronized' });
        toast({ title: "Vault Updated", description: `Archived ${total} cinematic nodes` });
        setTimeout(() => syncService.reset(), 5000);
      } catch (err: any) {
        toast({ variant: "destructive", title: "Import Failed", description: err.message });
        syncService.update({ status: 'error', message: err.message });
      } finally {
        setIsProcessing(false);
        if (event.target) event.target.value = '';
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-glow">Vault Integration</h1>
        <p className="text-muted-foreground mt-2">Professional archival engine for your media history</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="p-8 border-white/5 hover:border-secondary/40 transition-colors">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center border border-secondary/30 shadow-lg shrink-0">
                <Archive className="text-secondary w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold">Letterboxd History</h3>
                <p className="text-sm text-muted-foreground">Import your entire cinematic timeline via <code>diary.csv</code></p>
              </div>
              <div className="relative">
                <input type="file" accept=".csv" className="hidden" id="lb-upload" onChange={handleLetterboxdCSV} disabled={isProcessing} />
                <Button asChild variant="secondary" className="h-12 px-8 rounded-xl font-bold gap-2">
                  <label htmlFor="lb-upload" className="cursor-pointer">
                    <FileUp className="w-4 h-4" /> Upload CSV
                  </label>
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-white/5 hover:border-primary/40 transition-colors">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg shrink-0">
                <Tv className="text-primary w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold">MyAnimeList Uplink</h3>
                <p className="text-sm text-muted-foreground">Synchronize your anime library via direct API integration</p>
              </div>
              <Button onClick={handleMalApiSync} variant="outline" className="h-12 px-8 rounded-xl border-primary/20 hover:bg-primary/10 text-primary font-bold gap-2" disabled={isProcessing}>
                <Zap className="w-4 h-4" /> Initialize Sync
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="bg-primary/5 border-primary/20 p-6 flex gap-4">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">MediaVerse: Immutable Record</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By integrating your data, your media history is permanently archived in the MediaVerse vault. This protects your history from external platform volatility.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="border-red-500/20 bg-red-500/5 p-8 mt-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 shadow-lg shrink-0">
                <Trash2 className="text-red-500 w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-red-500">Danger Zone: Reset Vault</h3>
                <p className="text-sm text-muted-foreground">Permanently erase all nodes and archival logs. Your profile is preserved.</p>
              </div>
              <Button onClick={handlePurgeVault} variant="destructive" className="h-12 px-8 rounded-xl font-bold gap-2" disabled={isProcessing}>
                <AlertTriangle className="w-4 h-4" /> Purge Data
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="space-y-6">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Archival Logs
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {logsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : syncLogs.map((log: any) => (
                <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-tighter text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="text-green-400 font-black uppercase tracking-widest">{log.status}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed font-medium">{log.message}</p>
                </div>
              ))}
              {!logsLoading && syncLogs.length === 0 && (
                <div className="text-center py-10 opacity-30 italic text-xs">No archival events recorded</div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
