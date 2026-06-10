import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark'
  hover?: boolean
}

export function GlassCard({ className, variant = 'default', hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variant === 'default' ? "glass-card" : "glass-dark",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}