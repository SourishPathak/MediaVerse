"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Tv, Film, MoreVertical, Trash2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface MediaCardProps {
  item: any
  onDelete?: (id: string) => void
}

export function MediaCard({ item, onDelete }: MediaCardProps) {
  const isAnime = item.type === 'anime'
  const posterUrl = item.imageUrl
  const isPending = item.posterStatus === 'pending'
  const hasRating = (item.rating || 0) > 0
  
  const detailPath = isAnime ? `/media/${item.id}` : `/movie/${item.id}`

  const MetadataBelow = () => (
    <div className="flex items-start justify-between gap-2 px-1 mt-3">
      <Link href={detailPath} className="min-w-0 flex-1 group/title">
        <h3 className="font-headline font-bold text-xs md:text-sm leading-tight truncate group-hover/title:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-1.5 font-black">
          {isAnime ? <Tv className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary shrink-0" /> : <Film className="w-2.5 h-2.5 md:w-3 md:h-3 text-secondary shrink-0" />}
          <span className="truncate">{item.status?.replace('_', ' ') || 'ARCHIVED'}</span>
        </p>
      </Link>

      {onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-white/10">
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-400 focus:text-red-400 cursor-pointer text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Entry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  return (
    <div className="group relative flex flex-col animate-in fade-in zoom-in duration-300 w-full">
      <Link href={detailPath} className="block w-full">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl md:rounded-2xl border border-white/10 shadow-xl transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary/40 group-hover:shadow-primary/10 bg-white/5 w-full">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={item.title}
              fill
              className={cn(
                "object-cover transition-transform duration-700 group-hover:scale-110",
                isPending && "opacity-30 blur-sm"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground" style={{ backgroundColor: item.themeColor || 'transparent' }}>
              {isAnime ? <Tv className="h-10 w-10 md:h-16 md:w-16 opacity-10" /> : <Film className="h-10 w-10 md:h-16 md:w-16 opacity-10" />}
              {!isPending && !posterUrl && <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest mt-2 px-2 text-center break-words max-w-full">{item.title}</span>}
            </div>
          )}
          
          {isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 bg-black/60 backdrop-blur-[4px]">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-primary animate-spin" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary/80">Archiving</span>
            </div>
          )}
          
          <div className="poster-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {hasRating && (
            <div className="absolute top-2 left-2 md:top-4 md:left-4">
              <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white flex gap-1 md:gap-1.5 items-center px-1.5 md:px-2 py-0.5 h-5 md:h-6 shadow-xl border">
                <Star className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-yellow-500 fill-current" />
                <span className="text-[9px] md:text-[11px] font-black font-headline">{(item.rating / 2).toFixed(1)}</span>
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <MetadataBelow />
    </div>
  )
}
