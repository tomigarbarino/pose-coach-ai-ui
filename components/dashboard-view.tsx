"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import LanguageSelector from "./language-selector"
import { getScans, getProfile } from "@/lib/storage"
import type { ScanResult, UserProfile } from "@/lib/storage"
import Image from "next/image"

interface DashboardViewProps {
  onAnalyzePose: () => void
}

export default function DashboardView({ onAnalyzePose }: DashboardViewProps) {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [recentScans] = useState<ScanResult[]>(() => getScans().slice(0, 3))
  const [profile] = useState<UserProfile>(() => getProfile())

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-3 pt-8">
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>
        <div className="inline-flex items-center gap-2 text-primary font-mono text-sm mb-2 animate-in slide-in-from-top duration-500">
          <TrendingUp className="h-4 w-4" />
          <span className="tracking-wider">{t("appName")}</span>
        </div>
        <h1 className="text-4xl font-bold text-balance leading-tight animate-in slide-in-from-top duration-500 delay-100">
          {t("readyToPerfect")} <br />
          {t("yourPose")}
        </h1>
        <p className="text-muted-foreground text-lg animate-in slide-in-from-top duration-500 delay-200">
          {t("aiPoweredAnalysis")}
        </p>
      </div>

      {/* Main Action Button */}
      <div className="flex justify-center py-4 animate-in zoom-in duration-500 delay-300">
        <Button
          size="lg"
          onClick={onAnalyzePose}
          className="h-16 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Camera className="mr-2 h-6 w-6" />
          {t("analyzePose")}
        </Button>
      </div>

      {/* Recent Scans */}
      <div className="space-y-4 animate-in slide-in-from-bottom duration-500 delay-400">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("recentScans")}</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 transition-colors">
            {t("viewAll")}
          </Button>
        </div>

        {recentScans.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="flex gap-4 pb-2">
              {recentScans.map((scan, index) => (
                <Card
                  key={scan.id}
                  className="flex-shrink-0 w-40 overflow-hidden bg-card border-border hover:border-primary/50 transition-all hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${index * 100 + 500}ms` }}
                >
                  <div className="aspect-square relative overflow-hidden bg-secondary">
                    <Image
                      src={scan.thumbnail || "/placeholder.svg?height=160&width=160"}
                      alt={t(scan.pose as any)}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform hover:scale-110"
                      unoptimized
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{t(scan.pose as any)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t("score")}</span>
                      <span
                        className={`text-sm font-bold transition-colors ${scan.score >= 85 ? "text-primary" : scan.score >= 70 ? "text-chart-3" : "text-destructive"}`}
                      >
                        {scan.score}/100
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 bg-card border-border border-dashed animate-in fade-in duration-500 delay-500">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === "en" ? "No scans yet. Start analyzing!" : "Sin escaneos aún. ¡Empieza a analizar!"}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom duration-500 delay-600">
        <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all hover:scale-105">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("totalScans")}</p>
            <p className="text-3xl font-bold">{profile?.totalScans || 0}</p>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all hover:scale-105">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("avgScore")}</p>
            <p className="text-3xl font-bold text-primary">{profile?.averageScore || 0}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
