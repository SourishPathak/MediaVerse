
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Loader2, Star, Film, ArrowLeft, Tag, Clock, Shield, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

function StarRating({ value, onChange, disabled }: { value: number, onChange: (val: number) => void, disabled?: boolean }) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const displayValue = hoverValue !== null ? hoverValue : value
  
  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full overflow-x-auto custom-scrollbar pb-1">
      {[...Array(5)].map((_, i) => {
        const starIndex = i + 1
        const ratingValue = starIndex * 2
        const halfRatingValue = ratingValue - 1
        
        return (
          <div key={i} className="relative flex items-center group/star shrink-0">
            <div className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer" onMouseEnter={() => !disabled && setHoverValue(halfRatingValue)} onMouseLeave={() => !disabled && setHoverValue(null)} onClick={() => !disabled && onChange(halfRatingValue)} />
            <div className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer" onMouseEnter={() => !disabled && setHoverValue(ratingValue)} onMouseLeave={() => !disabled && setHoverValue(null)} onClick={() => !disabled && onChange(ratingValue)} />
            <div className="relative">
              {displayValue >= ratingValue ? (
                <Star className={cn("w-7 h-7 md:w-10 md:h-10 text-yellow-500 fill-current drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]", disabled && "opacity-50")} />
              ) : displayValue >= halfRatingValue ? (
                <div className="relative">
                  <Star className="w-7 h-7 md:w-10 md:h-10 text-white/10" />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star className="w-7 h-7 md:w-10 md:h-10 text-yellow-500 fill-current" />
                  </div>
                </div>
              ) : (
                <Star className="w-7 h-7 md:w-10 md:h-10 text-white/10" />
              )}
            </div>
          </div>
        )
      })}
      <span className="ml-4 text-2xl md:text-4xl font-black font-headline text-white/70 tabular-nums shrink-0">
        {displayValue > 0 ? (displayValue / 2).toFixed(1) : "0.0"}
      </span>
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const [isUpdating, setIsUpdating] = React.useState(false)

  const movieRef = React.useMemo(() => {
    if (!db || !user?.uid || !id) return null
    return doc(db, 'users', user.uid, 'movies', id as string)
  }, [db, user?.uid, id])

  const { data: item, loading } = useDoc(movieRef)

  const handleUpdate = async (field: string, value: any) => {
    if (!movieRef || !item) return
    setIsUpdating(true)
    try {
      await updateDoc(movieRef, { [field]: value, updatedAt: serverTimestamp() })
      toast({ title: "Node Updated", description: "Archival parameters stabilized" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRetry = async () => {
    if (!movieRef) return
    try {
      await updateDoc(movieRef, { posterStatus: 'pending', updatedAt: serverTimestamp() })
      toast({ title: "Re-Analysis Initiated", description: "The protocol is re-evaluating the film identity." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Retry Failed", description: err.message })
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="w-16 h-16 text-primary animate-spin" /></div>
  if (!item) return <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8"><Shield className="w-24 h-24 text-muted-foreground opacity-10" /><h1 className="text-3xl font-headline font-black uppercase tracking-tighter">Node Not Found</h1><Button onClick={() => router.back()} variant="outline">Return to Archives</Button></div>

  const isPending = item.posterStatus === 'pending';
  const isFailed = item.posterStatus === 'failed';
  const isCompleted = item.posterStatus === 'completed';

  const forbiddenTags = ['cinema', 'archived', 'film', 'movie'];
  const cleanGenres = (item.genres || []).filter((g: string) => !forbiddenTags.includes(g.toLowerCase().trim()));

  return (
    <div className="animate-in fade-in duration-1000 pb-24 -mt-12 md:-mt-16 -mx-6 md:-mx-12 lg:-mx-16">
      <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <Button onClick={() => router.back()} variant="ghost" className="absolute top-8 left-6 md:left-12 z-50 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 hover:bg-white/10 text-white px-6 h-12 gap-2">
          <ArrowLeft className="w-5 h-5" /> <span>Back</span>
        </Button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 -mt-40 md:-mt-64">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col lg:flex-row gap-12 md:gap-20 items-start">
            <div 
              className="relative aspect-[2/3] w-full max-w-[300px] md:max-w-[420px] shrink-0 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/10 flex items-center justify-center"
              style={{ backgroundColor: item.themeColor || 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex flex-col items-center justify-center text-white/20">
                <Film className={cn("h-32 w-32 opacity-20", isPending && "animate-pulse")} />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] mt-6 text-center px-10">{item.title}</span>
              </div>
            </div>

            <div className="flex-1 space-y-10 w-full">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="outline" className={cn(
                    "uppercase tracking-[0.2em] h-9 px-5 flex gap-2.5 items-center text-[10px] font-black",
                    isFailed ? "text-red-500 border-red-500/30 bg-red-500/5" : isPending ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/5" : "text-green-500 border-green-500/30 bg-green-500/5"
                  )}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isFailed ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isPending ? "ANALYZING" : isFailed ? "ANALYSIS FAILED" : "ARCHIVED"}
                  </Badge>
                  <Badge variant="secondary" className="h-9 px-5 text-[10px] font-black uppercase tracking-[0.2em]">SOURCE: {item.platformSource}</Badge>
                  {isFailed && (
                    <Button variant="ghost" onClick={handleRetry} className="h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 hover:bg-primary/5">
                      RETRY PROTOCOL
                    </Button>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-tight break-words text-glow">{item.title}</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8 bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl">
                <div className="space-y-4">
                  <Label className="text-[11px] uppercase tracking-[0.3em] font-black text-muted-foreground ml-1">Archival Status</Label>
                  <select 
                    disabled={isUpdating} 
                    value={item.status} 
                    onChange={(e) => handleUpdate('status', e.target.value)}
                    className="h-16 w-full rounded-2xl bg-white/5 border-white/10 px-4 font-bold text-lg outline-none focus:ring-2 focus:ring-primary/50 text-white"
                  >
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="dropped">Dropped</option>
                    <option value="plan_to_watch">Plan to Watch</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[11px] uppercase tracking-[0.3em] font-black text-muted-foreground ml-1">Rating</Label>
                  <div className="h-16 flex items-center px-5 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <StarRating value={item.rating || 0} onChange={(val) => handleUpdate('rating', val)} disabled={isUpdating} />
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2 xl:col-span-2">
                  <Label className="text-[11px] uppercase tracking-[0.3em] font-black text-muted-foreground ml-1">Logged Date</Label>
                  <div className="flex items-center gap-5 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Clock className="w-8 h-8 text-blue-500" /></div>
                    <p className="text-2xl md:text-4xl font-black font-headline tracking-tighter">{item.watchDate || 'UNKWN'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-20">
            <div className="space-y-10 w-full">
              <div className="flex items-center gap-4"><Tag className="w-6 h-6 text-primary" /><h3 className="font-headline font-black text-2xl uppercase tracking-tighter">Classification</h3></div>
              <div className="flex flex-wrap gap-4">
                {isPending ? (
                  <span className="px-8 md:px-12 py-3 md:py-4 rounded-3xl bg-white/5 border border-white/10 text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic animate-pulse flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Film Identity...
                  </span>
                ) : cleanGenres.length > 0 ? cleanGenres.map((g: string) => (
                  <span key={g} className="px-8 md:px-12 py-3 md:py-4 rounded-3xl bg-primary/10 border border-primary/20 text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-primary">
                    {g}
                  </span>
                )) : (
                  <span className={cn(
                    "px-8 md:px-12 py-3 md:py-4 rounded-3xl border text-[11px] md:text-xs font-black uppercase tracking-[0.3em] italic",
                    isFailed ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-muted-foreground"
                  )}>
                    {isFailed ? "Classification Unavailable" : "Classification Pending AI Protocol"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
