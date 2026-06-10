
"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/glass-card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { exchangeMalCode } from "@/actions/mal-actions"
import { useUser, useFirestore } from "@/firebase"
import { doc, setDoc, serverTimestamp, collection, writeBatch } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function MalCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const { user } = useUser()
  const db = useFirestore()
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing')
  const processedRef = useRef(false)

  useEffect(() => {
    async function processAuth() {
      if (processedRef.current || !db || !user) return;
      processedRef.current = true;

      const storedState = localStorage.getItem('mal_state')
      const codeVerifier = localStorage.getItem('mal_code_verifier')

      if (!code || state !== storedState) {
        setStatus('error')
        toast({ variant: "destructive", title: "Handshake Failed", description: "State mismatch." })
        return
      }

      try {
        const { items, tokens } = await exchangeMalCode(code, codeVerifier!)
        
        // Save tokens to User profile
        const userRef = doc(db, 'users', user.uid)
        await setDoc(userRef, { malTokens: tokens }, { merge: true })

        // Batch save anime items
        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = items.slice(i, i + batchSize);
          chunk.forEach((item: any) => {
            const mediaRef = doc(db, 'users', user.uid, 'media', item.id);
            batch.set(mediaRef, { ...item, updatedAt: serverTimestamp() }, { merge: true });
          });
          await batch.commit();
        }

        const logRef = doc(collection(db, 'users', user.uid, 'sync_logs'))
        await setDoc(logRef, {
          timestamp: new Date().toISOString(),
          provider: 'MyAnimeList API',
          status: 'success',
          count: items.length,
          message: `Synchronized ${items.length} nodes.`
        })

        setStatus('success')
        toast({ title: "Nodes Integrated", description: `Archived ${items.length} anime nodes.` })
        setTimeout(() => router.push('/dashboard'), 2000)
      } catch (err: any) {
        console.error("Handshake Error:", err);
        setStatus('error')
        toast({ variant: "destructive", title: "Sync Failed", description: err.message })
      }
    }

    if (code && state && db && user) {
      processAuth()
    }
  }, [code, state, router, user, db])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <GlassCard className="w-full max-w-md p-10 flex flex-col items-center text-center gap-6 border-white/10">
        {status === 'error' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-glow">Uplink Rejected</h1>
            <p className="text-muted-foreground">Handshake failed. Tokens could not be exchanged.</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-glow text-green-400">Sync Complete</h1>
            <p className="text-muted-foreground">Vault nodes stabilized and indexed.</p>
          </>
        ) : (
          <>
            <div className="relative">
              <Loader2 className="w-20 h-20 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-headline text-glow">Indexing Vault</h1>
            <p className="text-muted-foreground">Exchanging tokens and archiving nodes...</p>
          </>
        )}
      </GlassCard>
    </div>
  )
}
