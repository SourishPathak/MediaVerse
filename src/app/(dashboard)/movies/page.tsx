"use client"

import { useMemo } from "react"
import { MediaCard } from "@/components/media-card"
import { Loader2, Plus, Film } from "lucide-react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, doc, deleteDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function MoviesPage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()

  const movieQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'movies'))
  }, [user?.uid, db])

  const { data: movies = [], loading: mediaLoading } = useCollection(movieQuery)

  const handleDelete = (id: string) => {
    if (!db || !user?.uid) return
    const mediaRef = doc(db, 'users', user.uid, 'movies', id)
    deleteDoc(mediaRef).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mediaRef.path,
        operation: 'delete'
      }))
    })
    toast({ title: "Film Erased", description: "Entry removed from your films archives." })
  }

  if (userLoading || mediaLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <Film className="absolute inset-0 m-auto w-4 h-4 text-primary" />
        </div>
        <p className="text-muted-foreground font-headline animate-pulse text-sm">Accessing film vaults...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-glow uppercase leading-none">FILMS</h1>
          <p className="text-muted-foreground mt-4 text-sm md:text-xl font-medium max-w-xl">Archiving your journey through films in visual tiles.</p>
        </div>
      </header>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 md:py-40 glass-card rounded-[2rem] md:rounded-[2.5rem] text-center border-dashed px-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <Plus className="text-muted-foreground w-8 h-8 md:w-10 md:h-10 opacity-20" />
          </div>
          <h2 className="text-xl md:text-2xl font-headline font-bold mb-2 uppercase">The Films Vault is Silent</h2>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">Upload your Letterboxd CSV in the Sync Engine to visualize your history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-8">
          {movies.map((item: any) => (
            <MediaCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
