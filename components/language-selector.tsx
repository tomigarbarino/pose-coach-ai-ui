"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "es" : "en")} className="gap-2">
      <Globe className="h-4 w-4" />
      <span className="font-medium uppercase">{language}</span>
    </Button>
  )
}
