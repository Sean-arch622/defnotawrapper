import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DockProps {
  className?: string
  items: {
    icon: LucideIcon
    label: string
    onClick?: () => void
    isActive?: boolean
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  isActive?: boolean
  className?: string
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, isActive, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-0.5 py-1.5 px-3 relative transition-colors",
          className
        )}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
          {label}
        </span>
      </button>
    )
  }
)
DockIconButton.displayName = "DockIconButton"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 safe-bottom",
          className
        )}
      >
        <div className="mx-3 mb-2 rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/30">
          <div className="flex items-center justify-around py-1.5 px-1">
            {items.map((item) => (
              <DockIconButton key={item.label} {...item} />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock }
