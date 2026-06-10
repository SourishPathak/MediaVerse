"use client"

import { useState, useMemo } from "react"
import { MediaCard } from "@/components/media-card"
import { GlassCard } from "@/components/glass-card"
import { 
  Tv, 
  Film, 
  TrendingUp, 
  Star, 
  Sparkles,
  Loader2,
  X,
  History,
  ArrowRight,
  ArrowLeft,
  Quote,
  BarChart as BarChartIcon,
  Trophy,
  Zap,
  Crown,
  Ghost,
  Clapperboard,
  Dna,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateMonthlyNarrative, type GenerateMonthlyNarrativeOutput } from "@/ai/flows/generate-monthly-narrative"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
} from 'recharts'
import { ChartContainer } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import Link from "next/link"

const ICON_MAP: Record<string, any> = {
  trophy: Trophy,
  zap: Zap,
  crown: Crown,
  ghost: Ghost,
  clapperboard: Clapperboard,
  dna: Dna,
  heart: Heart,
  sparkles: Sparkles
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiData, setAiData] = useState<GenerateMonthlyNarrativeOutput | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const animeRecentQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, 'users', user.uid, 'media'), 
      orderBy('updatedAt', 'desc'),
      limit(6)
    )
  }, [user?.uid, db])

  const movieRecentQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, 'users', user.uid, 'movies'), 
      orderBy('updatedAt', 'desc'),
      limit(6)
    )
  }, [user?.uid, db])

  const totalAnimeQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'media'))
  }, [user?.uid, db])

  const totalMovieQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, 'users', user.uid, 'movies'))
  }, [user?.uid, db])

  const { data: animeRecent = [], loading: animeRecentLoading } = useCollection(animeRecentQuery)
  const { data: movieRecent = [], loading: movieRecentLoading } = useCollection(movieRecentQuery)
  const { data: allAnime = [], loading: animeTotalLoading } = useCollection(totalAnimeQuery)
  const { data: allMovies = [], loading: movieTotalLoading } = useCollection(totalMovieQuery)

  const mediaLoading = animeRecentLoading || movieRecentLoading || animeTotalLoading || movieTotalLoading
  const totalMediaCount = allAnime.length + allMovies.length
  
  const avgRating = useMemo(() => {
    const ratedItems = [...allAnime, ...allMovies].filter((item: any) => (item.rating || 0) > 0);
    if (ratedItems.length === 0) return "0.0";
    const sum = ratedItems.reduce((acc, curr: any) => acc + (curr.rating || 0), 0);
    return ((sum / ratedItems.length) / 2).toFixed(1);
  }, [allAnime, allMovies]);

  const handleGenerateWrapped = async () => {
    if (totalMediaCount === 0) {
      toast({ title: "Vault Empty", description: "Sync nodes to begin your archival journey." })
      return
    }

    setIsAiLoading(true)
    try {
      const allGenres = [...allAnime, ...allMovies].flatMap((i: any) => i.genres || [])
      const genreCounts: Record<string, number> = {}
      allGenres.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1)
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g)

      const result = await generateMonthlyNarrative({
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalAnimeWatched: allAnime.length,
        totalMoviesWatched: allMovies.length,
        totalHoursWatched: Math.round(allAnime.length * 0.4 + allMovies.length * 2.1),
        topGenres,
        mostWatchedAnime: allAnime.slice(0, 3).map((i: any) => i.title),
        mostWatchedMovies: allMovies.slice(0, 3).map((i: any) => i.title)
      })
      
      if (result) {
        setAiData(result)
        setCurrentStep(0)
        setIsDialogOpen(true)
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Offline", description: "The archival story could not be told." })
    } finally {
      setIsAiLoading(false)
    }
  }

  const nextStep = () => aiData && currentStep < 5 && setCurrentStep(s => s + 1)
  const prevStep = () => currentStep > 0 && setCurrentStep(s => s - 1)

  if (userLoading || mediaLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 md:space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
        <div className="min-w-0 space-y-4">
          <h1 className="font-headline text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-glow text-white break-words leading-[0.9]">MediaVerse</h1>
          <p className="text-muted-foreground text-lg md:text-2xl font-medium max-w-2xl leading-snug">
            Explorer {user?.displayName || 'Active'}. Vault online.
          </p>
        </div>
        <div className="flex shrink-0">
           <Button 
            className="group relative overflow-hidden rounded-full bg-white text-black hover:bg-white/90 h-16 md:h-20 px-8 md:px-12 shadow-2xl transition-all hover:scale-105 active:scale-95"
            onClick={handleGenerateWrapped}
            disabled={isAiLoading}
           >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 md:gap-4 relative z-10">
              {isAiLoading ? <Loader2 className="w-5 h-5 md:w-6 h-6 animate-spin" /> : <Sparkles className="w-5 h-5 md:w-6 h-6 text-primary" />}
              <span className="text-lg md:text-xl font-black uppercase tracking-tighter">AI Wrapped</span>
            </div>
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'ANIME', value: allAnime.length, icon: Tv, color: 'text-primary' },
          { label: 'FILMS', value: allMovies.length, icon: Film, color: 'text-primary' },
          { label: 'VAULT TOTAL', value: totalMediaCount, icon: History, color: 'text-white' },
          { label: 'SYSTEM RATING', value: avgRating, icon: Star, color: 'text-yellow-500' },
        ].map((stat, i) => (
          <GlassCard key={i} className="flex flex-col gap-4 md:gap-6 p-6 md:p-8 lg:p-10 border-white/5 hover:border-white/20 transition-all">
            <stat.icon className={cn("w-8 h-8 md:w-10 md:h-10", stat.color)} />
            <div>
              <p className="text-4xl sm:text-5xl md:text-7xl font-black font-headline tracking-tighter text-white">{stat.value}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-[0.4em] font-black mt-1 md:mt-2">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <section className="space-y-10 md:space-y-16">
        <div className="flex items-center gap-4 md:gap-6">
          <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          <h2 className="font-headline text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">Recently Synchronized</h2>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 md:gap-20">
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Tv className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary">ANIME</h3>
              </div>
              <Link href="/anime" className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                FULL ARCHIVE <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8">
              {animeRecent.map((item: any) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Film className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary">FILMS</h3>
              </div>
              <Link href="/movies" className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                FULL ARCHIVE <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8">
              {movieRecent.map((item: any) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] md:w-full max-w-lg bg-[#0a0a0c] border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden outline-none shadow-2xl flex flex-col max-h-[90vh]">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-[60] flex gap-1 px-1 pt-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn("h-full flex-1 rounded-full transition-all duration-500", i <= currentStep ? "bg-primary" : "bg-white/10")} />
            ))}
          </div>

          <div className="relative h-full flex flex-col min-h-[400px] md:min-h-[500px] overflow-y-auto custom-scrollbar">
            {currentStep === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/20">
                  <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <div className="space-y-4">
                  <Badge className="bg-primary/20 text-primary border-none text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black px-4 py-1">ARCHIVAL RECAP</Badge>
                  <h2 className="text-5xl md:text-7xl font-headline font-black tracking-tighter leading-none uppercase">THE<br/>WRAPPED</h2>
                  <p className="text-muted-foreground font-medium text-base md:text-lg leading-relaxed pt-2 md:pt-4">Your entertainment identity for {aiData?.viewerPersona ? new Date().toLocaleString('default', { month: 'long' }) : 'this month'}.</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-8 md:space-y-10 animate-in slide-in-from-right duration-500">
                <div className="grid grid-cols-2 gap-4 md:gap-8 w-full">
                  <div className="bg-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 space-y-2">
                    <p className="text-3xl md:text-4xl font-black font-headline text-primary">{allAnime.length}</p>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Worlds Explored</p>
                  </div>
                  <div className="bg-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 space-y-2">
                    <p className="text-3xl md:text-4xl font-black font-headline text-blue-400">{allMovies.length}</p>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lives Lived</p>
                  </div>
                </div>
                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-2xl md:text-3xl font-headline font-black tracking-tighter italic uppercase">&ldquo;The Dimension Traveler&rdquo;</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium text-sm md:text-base">
                    {aiData?.narration}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex-1 flex flex-col justify-center p-8 md:p-12 space-y-8 md:space-y-10 animate-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <BarChartIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Archival Pulse</h3>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter uppercase">Your Momentum</h2>
                </div>
                <div className="h-56 md:h-64 w-full bg-white/[0.02] rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 p-4 md:p-8">
                  <ChartContainer config={{
                    anime: { label: "Anime", color: "hsl(var(--primary))" },
                    movies: { label: "Films", color: "#3b82f6" }
                  }} className="h-full">
                    <BarChart data={aiData?.suggestedActivityDistribution}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800 }} 
                        dy={10}
                      />
                      <Bar dataKey="anime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="movies" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex-1 flex flex-col justify-center p-8 md:p-12 space-y-6 md:space-y-8 animate-in slide-in-from-right duration-500">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500">LEGENDARY NODES</h3>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter uppercase">Archival Awards</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {aiData?.achievements.map((ach, i) => {
                    const IconComp = ICON_MAP[ach.icon.toLowerCase()] || Trophy
                    return (
                      <div key={i} className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/5 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] hover:border-primary/40 transition-all group">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <IconComp className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="text-base md:text-lg font-black font-headline tracking-tighter text-white truncate uppercase">{ach.title}</p>
                          <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-tight md:leading-relaxed">{ach.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-8 md:space-y-10 animate-in slide-in-from-right duration-500">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 border-2 border-dashed border-primary/40 flex items-center justify-center relative">
                  <Ghost className="w-12 h-12 md:w-16 md:h-16 text-primary animate-bounce" />
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-col items-center gap-2">
                    <Quote className="w-5 h-5 md:w-6 md:h-6 text-primary/40 -rotate-12" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">ARCHIVAL INSIGHT</h3>
                  </div>
                  <p className="text-xl md:text-2xl font-headline font-bold text-white leading-tight px-4 italic">
                    &ldquo;{aiData?.surpriseInsight}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-10 md:space-y-12 animate-in slide-in-from-right duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 blur-[60px] md:blur-[80px] rounded-full animate-pulse" />
                  <Crown className="w-24 h-24 md:w-32 md:h-32 text-white relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" />
                </div>
                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">FINAL IDENTITY UNLOCKED</p>
                  <h2 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-glow uppercase">{aiData?.viewerPersona}</h2>
                  <p className="text-muted-foreground max-w-xs mx-auto text-xs md:text-sm font-medium leading-relaxed pt-2 md:pt-4">
                    Your month was a cultural expedition across dimensions. Archive stabilized.
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(false)} className="w-full h-14 md:h-16 rounded-2xl bg-white text-black font-black uppercase tracking-tighter hover:bg-white/90 shadow-2xl transition-all">
                  ACKNOWLEDGE RECORD
                </Button>
              </div>
            )}

            <div className="shrink-0 p-6 md:p-8 flex items-center justify-between border-t border-white/5 bg-black/20">
              <Button 
                variant="ghost" 
                onClick={prevStep} 
                disabled={currentStep === 0}
                className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 h-6" />
              </Button>
              
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", i === currentStep ? "bg-primary" : "bg-white/10")} />
                ))}
              </div>

              <Button 
                variant="ghost" 
                onClick={currentStep === 5 ? () => setIsDialogOpen(false) : nextStep}
                className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 text-primary hover:text-white"
              >
                {currentStep === 5 ? <X className="w-5 h-5 md:w-6 h-6" /> : <ArrowRight className="w-5 h-5 md:w-6 h-6" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
