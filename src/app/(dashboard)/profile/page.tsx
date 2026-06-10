
"use client"

import { useMemo } from "react"
import { GlassCard } from "@/components/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Share2, Trophy, Calendar, MapPin, Link as LinkIcon, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query } from "firebase/firestore"

const badges = [
  { id: 1, name: "Early Explorer", icon: "🚀", color: "blue" },
  { id: 2, name: "Anime Otaku", icon: "🍥", color: "purple" },
  { id: 3, name: "Cinephile", icon: "🎞️", color: "orange" },
  { id: 4, name: "Critic", icon: "✍️", color: "green" },
  { id: 5, name: "Marathon Runner", icon: "🏃", color: "red" },
]

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()

  const animeQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'media'))
  }, [user?.uid, db])

  const movieQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'movies'))
  }, [user?.uid, db])

  const { data: animeItems = [], loading: animeLoading } = useCollection(animeQuery)
  const { data: movieItems = [], loading: movieLoading } = useCollection(movieQuery)

  if (userLoading || animeLoading || movieLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  const totalNodes = animeItems.length + movieItems.length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard className="p-0 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] relative">
           <Button size="icon" className="absolute top-4 right-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
             <Share2 className="w-4 h-4 text-white" />
           </Button>
        </div>
        <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-end gap-6 relative">
          <Avatar className="h-32 w-32 border-4 border-background rounded-3xl shadow-2xl">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-bold">{user?.displayName || 'Active Explorer'}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Virtual Vault</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Profile Active</span>
                <span className="flex items-center gap-1 truncate max-w-[200px]"><LinkIcon className="w-3 h-3" /> {user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="space-y-4">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2 text-glow">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center gap-2 bg-white/5 p-4 rounded-2xl border border-white/10 flex-1 min-w-[100px] text-center hover:bg-white/10 transition-colors">
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="space-y-6">
            <h3 className="font-headline text-xl font-bold uppercase tracking-tighter">Archival Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-3xl font-bold text-primary">{totalNodes}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Total Nodes</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-3xl font-bold text-secondary">{animeItems.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Anime Protocol</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-3xl font-bold text-blue-400">{movieItems.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Cinema Archives</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-3xl font-bold text-green-500">{(totalNodes * 2.4).toFixed(0)}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">System Index</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
