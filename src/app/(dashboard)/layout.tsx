"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Film, 
  Tv, 
  Import, 
  Search, 
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar 
} from "@/components/ui/sidebar"
import { SyncProgressIndicator } from "@/components/SyncProgressIndicator"
import { useAnimeEnrichment } from "@/hooks/use-anime-enrichment"
import { useMovieEnrichment } from "@/hooks/use-movie-enrichment"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Tv, label: "Anime", href: "/anime" },
  { icon: Film, label: "Films", href: "/movies" },
  { icon: Import, label: "Sync Engine", href: "/import" },
]

function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const { setOpenMobile } = useSidebar()

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      router.push("/login")
    }
  }

  if (!user) return null

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-white/5 bg-[#0a0a0c]">
      <SidebarHeader className="p-4 flex items-center justify-between group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={() => setOpenMobile(false)}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Film className="text-white w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-glow text-white group-data-[collapsible=icon]:hidden whitespace-nowrap">MediaVerse</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                className={cn(
                  "flex items-center gap-4 px-3 py-6 rounded-2xl transition-all relative h-12",
                  pathname === item.href 
                    ? "bg-primary/20 text-primary hover:bg-primary/30" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Link href={item.href} onClick={() => setOpenMobile(false)}>
                  <item.icon className={cn("w-5 h-5 shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium text-base group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <Separator className="bg-white/5 mb-4" />
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
          <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xs truncate text-white">{user.displayName || 'Explorer'}</span>
            <span className="text-[9px] text-muted-foreground truncate uppercase tracking-widest">{user.email}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-400/10 mt-2 gap-3 h-10 rounded-xl px-2 group-data-[collapsible=icon]:justify-center"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-medium text-xs group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

function DashboardHeader() {
  const { state } = useSidebar()

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/50 backdrop-blur-xl border-b border-white/5 z-50 shrink-0 sticky top-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-10 w-10 hover:bg-white/5 rounded-xl" />
        <div className="h-4 w-px bg-white/10 hidden md:block" />
        <nav className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          <span>MEDIA</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary/70">ARCHIVES</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors">
          <Link href="/search">
            <Search className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useAnimeEnrichment();
  useMovieEnrichment();

  React.useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login")
    }
  }, [user, userLoading, router])

  if (userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden bg-background w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-background">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12">
              {children}
            </div>
            <SyncProgressIndicator />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
