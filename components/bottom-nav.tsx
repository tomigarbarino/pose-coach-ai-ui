"use client"

import { Home, History, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"

interface BottomNavProps {
  currentView: string
  onViewChange: (view: "home" | "history" | "profile" | "social") => void
}

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const navItems = [
    { id: "home" as const, icon: Home, label: "home" as const },
    { id: "social" as const, icon: Users, label: language === "en" ? "Community" : "Comunidad" },
    { id: "history" as const, icon: History, label: "history" as const },
    { id: "profile" as const, icon: User, label: "profile" as const },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around px-6 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">
                  {typeof item.label === "string" ? item.label : t(item.label)}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
