"use client"

import { useMemo, useState } from "react"
import { MediaCard } from "@/components/media-card"
import { Loader2, Tv, PlusCircle, Calendar as CalendarIcon, Tag } from "lucide-react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AnimePage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [newAnime, setNewAnime] = useState({
    title: "",
    status: "completed",
    rating: "0",
    genres: "",
    watchDate: new Date().toISOString().split('T')[0]
  })

  const animeQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'media'), where('type', '==', 'anime'))
  }, [user?.uid, db])

  const { data: anime = [], loading: mediaLoading } = useCollection(animeQuery)

  const handleDelete = (id: string) => {
    if (!db || !user?.uid) return
    const mediaRef = doc(db, 'users', user.uid, 'media', id)
    deleteDoc(mediaRef).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mediaRef.path,
        operation: 'delete'
      }))
    })
    toast({ title: "Node Erased", description: "Media entry removed from archives." })
  }

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user?.uid || !newAnime.title) return

    setIsSubmitting(true)
    const id = `manual_${Date.now()}`
    const mediaRef = doc(db, 'users', user.uid, 'media', id)
    
    const animeData = {
      id,
      title: newAnime.title,
      type: 'anime',
      status: newAnime.status,
      rating: parseFloat(newAnime.rating),
      genres: newAnime.genres.split(',').map(g => g.trim()).filter(Boolean),
      watchDate: newAnime.watchDate,
      platformSource: 'manual',
      posterStatus: 'completed',
      updatedAt: serverTimestamp()
    }

    setDoc(mediaRef, animeData, { merge: true })
      .then(() => {
        toast({ title: "Node Archived", description: "Manual entry stabilized in vault." })
        setIsAddDialogOpen(false)
        setNewAnime({
          title: "",
          status: "completed",
          rating: "0",
          genres: "",
          watchDate: new Date().toISOString().split('T')[0]
        })
      })
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: mediaRef.path,
          operation: 'write'
        }))
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  if (userLoading || mediaLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <Tv className="absolute inset-0 m-auto w-4 h-4 text-primary" />
        </div>
        <p className="text-muted-foreground font-headline animate-pulse text-sm">Synchronizing anime archives...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-glow uppercase leading-none">ANIME</h1>
          <p className="text-muted-foreground mt-4 text-sm md:text-xl font-medium max-w-xl">Your synchronized collection from MyAnimeList and beyond.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 font-black uppercase tracking-tighter gap-3 shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto">
              <PlusCircle className="w-5 h-5" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-background border-white/10 p-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-[95vw]">
            <div className="bg-primary/10 p-6 md:p-10 border-b border-white/5">
              <DialogTitle className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter text-glow">
                Archive Node
              </DialogTitle>
              <p className="text-muted-foreground text-xs md:text-sm mt-2">Initialize a manual entry in the MediaVerse vault.</p>
            </div>
            
            <form onSubmit={handleManualAdd} className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="space-y-3">
                <Label className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground ml-1">Title</Label>
                <div className="relative">
                  <Tv className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                  <Input 
                    placeholder="Enter anime title..." 
                    className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 transition-all font-bold"
                    value={newAnime.title}
                    onChange={(e) => setNewAnime({...newAnime, title: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground ml-1">Status</Label>
                  <Select value={newAnime.status} onValueChange={(val) => setNewAnime({...newAnime, status: val})}>
                    <SelectTrigger className="h-14 rounded-xl bg-white/5 border-white/10 font-bold">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watching">Watching</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                      <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground ml-1">Rating (0-10)</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="10" 
                    className="h-14 rounded-xl bg-white/5 border-white/10 font-bold"
                    value={newAnime.rating}
                    onChange={(e) => setNewAnime({...newAnime, rating: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground ml-1">Genres</Label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                  <Input 
                    placeholder="Action, Sci-Fi, Shonen..." 
                    className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 font-bold"
                    value={newAnime.genres}
                    onChange={(e) => setNewAnime({...newAnime, genres: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground ml-1">Watch Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                  <Input 
                    type="date"
                    className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 font-bold"
                    value={newAnime.watchDate}
                    onChange={(e) => setNewAnime({...newAnime, watchDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-14 md:h-16 rounded-2xl font-black uppercase tracking-tighter text-base md:text-lg"
                  disabled={isSubmitting || !newAnime.title}
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commit Node"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="h-14 md:h-16 px-8 rounded-2xl font-black uppercase tracking-tighter text-muted-foreground hover:bg-white/5"
                >
                  Abort
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {anime.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 md:py-40 glass-card rounded-[2rem] md:rounded-[2.5rem] text-center border-dashed px-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <Tv className="text-muted-foreground w-8 h-8 md:w-10 md:h-10 opacity-20" />
          </div>
          <h2 className="text-xl md:text-2xl font-headline font-bold mb-2 uppercase">No Anime Detected</h2>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm">Initialize a sync in the Sync Engine or create a manual node above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-8">
          {anime.map((item: any) => (
            <MediaCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
