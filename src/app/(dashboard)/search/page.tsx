"use client"

import { useState, useMemo } from "react"
import { MediaCard } from "@/components/media-card"
import { Input } from "@/components/ui/input"
import { Search as SearchIcon, Filter, Loader2, X, SlidersHorizontal, RotateCcw, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query } from "firebase/firestore"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const STATUS_OPTIONS = [
  { id: 'watching', label: 'Watching' },
  { id: 'completed', label: 'Completed' },
  { id: 'on_hold', label: 'On Hold' },
  { id: 'dropped', label: 'Dropped' },
  { id: 'plan_to_watch', label: 'Plan to Watch' },
]

export default function SearchPage() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Filter State
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [ratingRange, setRatingRange] = useState([0, 10]) 

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

  const mediaLoading = animeLoading || movieLoading
  
  const combinedMedia = useMemo(() => {
    return [...animeItems, ...movieItems]
  }, [animeItems, movieItems])

  // Get all unique genres for filtering
  const allUniqueGenres = useMemo(() => {
    const genres = new Set<string>()
    combinedMedia.forEach((item: any) => {
      item.genres?.forEach((g: string) => genres.add(g))
    })
    return Array.from(genres).sort()
  }, [combinedMedia])

  const filteredData = useMemo(() => {
    return combinedMedia.filter((item: any) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        item.title?.toLowerCase().includes(term) || 
        item.genres?.some((g: string) => g.toLowerCase().includes(term))

      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type)
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status)
      const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(g => item.genres?.includes(g))
      
      const rating = item.rating || 0
      const matchesRating = rating >= ratingRange[0] && rating <= ratingRange[1]

      return matchesSearch && matchesType && matchesStatus && matchesGenre && matchesRating
    })
  }, [searchTerm, combinedMedia, selectedTypes, selectedStatuses, selectedGenres, ratingRange])

  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0) + 
                            (selectedStatuses.length > 0 ? 1 : 0) + 
                            (selectedGenres.length > 0 ? 1 : 0) +
                            (ratingRange[0] > 0 || ratingRange[1] < 10 ? 1 : 0)

  const resetFilters = () => {
    setSelectedTypes([])
    setSelectedStatuses([])
    setSelectedGenres([])
    setRatingRange([0, 10])
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-glow">Library Index</h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-2xl">Query your entire visual archive across all platforms.</p>
      </header>

      <div className="relative group max-w-4xl">
        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground w-8 h-8 group-focus-within:text-primary transition-colors" />
        <Input 
          className="h-24 pl-20 pr-40 text-2xl md:text-4xl font-headline font-bold rounded-[2rem] bg-white/[0.03] border-white/10 focus:border-primary/50 transition-all focus:ring-0 placeholder:opacity-30"
          placeholder="SEARCH ARCHIVES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-white/10 border-white/10 h-12 px-6 gap-3 hover:bg-white/20 rounded-2xl transition-all border-none">
                <Filter className="w-4 h-4" />
                <span className="font-black uppercase tracking-tighter text-sm">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="bg-primary text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background/95 backdrop-blur-2xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
              <SheetHeader className="p-8 pb-4">
                <SheetTitle className="text-3xl font-headline font-black uppercase tracking-tighter flex items-center gap-3">
                  <SlidersHorizontal className="w-6 h-6 text-primary" />
                  Refine Search
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">Adjust your archival query parameters.</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-8 py-4">
                <div className="space-y-10 pb-8">
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Protocol Type</h4>
                    <div className="flex flex-wrap gap-3">
                      {['anime', 'movie'].map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox 
                            id={`type-${type}`} 
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              setSelectedTypes(prev => checked ? [...prev, type] : prev.filter(t => t !== type))
                            }}
                            className="border-white/20 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor={`type-${type}`} className="text-sm font-bold uppercase cursor-pointer">{type === 'movie' ? 'FILM' : 'ANIME'}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Archive Status</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {STATUS_OPTIONS.map((status) => (
                        <div key={status.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <Checkbox 
                            id={`status-${status.id}`} 
                            checked={selectedStatuses.includes(status.id)}
                            onCheckedChange={(checked) => {
                              setSelectedStatuses(prev => checked ? [...prev, status.id] : prev.filter(s => s !== status.id))
                            }}
                            className="border-white/20 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor={`status-${status.id}`} className="flex-1 text-sm font-bold uppercase cursor-pointer">{status.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">Genre Classification</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {allUniqueGenres.map((genre) => (
                        <div key={genre} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Checkbox 
                            id={`genre-${genre}`} 
                            checked={selectedGenres.includes(genre)}
                            onCheckedChange={(checked) => {
                              setSelectedGenres(prev => checked ? [...prev, genre] : prev.filter(g => g !== genre))
                            }}
                            className="border-white/20 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor={`genre-${genre}`} className="text-[10px] font-bold uppercase truncate cursor-pointer">{genre}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">System Rating</h4>
                      <span className="text-xs font-mono text-primary font-bold">
                        {(ratingRange[0] / 2).toFixed(1)} — {(ratingRange[1] / 2).toFixed(1)} ★
                      </span>
                    </div>
                    <Slider 
                      value={ratingRange} 
                      onValueChange={setRatingRange} 
                      max={10} 
                      step={1} 
                      className="py-4"
                    />
                  </div>
                </div>
              </ScrollArea>

              <SheetFooter className="p-8 pt-4 border-t border-white/10 bg-black/20 gap-4 flex-col sm:flex-row">
                <Button variant="ghost" onClick={resetFilters} className="flex-1 rounded-xl h-14 font-black uppercase tracking-tighter gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1 rounded-xl h-14 font-black uppercase tracking-tighter bg-primary hover:bg-primary/80">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mr-2">Active:</span>
          {selectedTypes.map(t => (
            <Badge key={t} variant="secondary" className="bg-primary/20 text-primary border-primary/20 gap-2 pl-3 pr-2 py-1 rounded-lg">
              {t === 'movie' ? 'FILMS' : 'ANIME'}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTypes(prev => prev.filter(i => i !== t))} />
            </Badge>
          ))}
          {selectedStatuses.map(s => (
            <Badge key={s} variant="secondary" className="bg-white/10 text-white border-white/10 gap-2 pl-3 pr-2 py-1 rounded-lg">
              {s.toUpperCase().replace('_', ' ')}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedStatuses(prev => prev.filter(i => i !== s))} />
            </Badge>
          ))}
          {selectedGenres.map(g => (
            <Badge key={g} variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-2 pl-3 pr-2 py-1 rounded-lg">
              {g.toUpperCase()}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGenres(prev => prev.filter(i => i !== g))} />
            </Badge>
          ))}
          {(ratingRange[0] > 0 || ratingRange[1] < 10) && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-2 pl-3 pr-2 py-1 rounded-lg">
              {(ratingRange[0]/2).toFixed(1)}-{(ratingRange[1]/2).toFixed(1)} ★
              <X className="w-3 h-3 cursor-pointer" onClick={() => setRatingRange([0, 10])} />
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {mediaLoading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))
        ) : filteredData.map((item: any) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
      
      {!mediaLoading && filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
          <SearchIcon className="w-24 h-24 mb-8 opacity-10" />
          <p className="text-2xl font-headline font-bold opacity-40">NO NODES MATCHING QUERY</p>
          <Button variant="link" className="text-primary mt-4 font-bold" onClick={resetFilters}>Clear all filters</Button>
        </div>
      )}
    </div>
  )
}
