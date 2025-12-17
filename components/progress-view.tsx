"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Target, Award, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { getStats, getScans } from "@/lib/storage"
import type { UserStats, ScanResult } from "@/lib/storage"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

export default function ProgressView() {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [chartData, setChartData] = useState<{ date: string; score: number; label: string }[]>([])

  useEffect(() => {
    const userStats = getStats()
    const scans = getScans()

    setStats(userStats)
    setRecentScans(scans)

    // Prepare chart data from last 30 days
    const data = userStats.scanHistory
      .slice(-30)
      .reverse()
      .map((entry) => ({
        date: entry.date,
        score: entry.score,
        label: new Date(entry.date).toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
          month: "short",
          day: "numeric",
        }),
      }))

    setChartData(data)
  }, [language])

  const getStreakMessage = (streak: number) => {
    if (language === "en") {
      if (streak === 0) return "Start your streak today!"
      if (streak === 1) return "Great start! Keep it up!"
      if (streak < 7) return "Building momentum!"
      if (streak < 30) return "Amazing consistency!"
      return "Legendary dedication!"
    } else {
      if (streak === 0) return "¡Comienza tu racha hoy!"
      if (streak === 1) return "¡Gran comienzo! ¡Sigue así!"
      if (streak < 7) return "¡Construyendo impulso!"
      if (streak < 30) return "¡Consistencia increíble!"
      return "¡Dedicación legendaria!"
    }
  }

  const getPosePerformance = () => {
    if (recentScans.length === 0) return []

    const poseGroups: { [key: string]: number[] } = {}

    recentScans.forEach((scan) => {
      if (!poseGroups[scan.pose]) {
        poseGroups[scan.pose] = []
      }
      poseGroups[scan.pose].push(scan.score)
    })

    return Object.entries(poseGroups).map(([pose, scores]) => ({
      pose,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
      bestScore: Math.max(...scores),
    }))
  }

  const posePerformance = getPosePerformance()

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{language === "en" ? "Your Progress" : "Tu Progreso"}</h1>
        <p className="text-muted-foreground">
          {language === "en" ? "Track your journey to the perfect pose" : "Rastrea tu camino hacia la pose perfecta"}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{stats?.averageScore || 0}</p>
          <p className="text-sm text-muted-foreground">{t("avgScore")}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-chart-3/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-chart-3" />
            </div>
          </div>
          <p className="text-3xl font-bold text-chart-3">{stats?.bestScore || 0}</p>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Best Score" : "Mejor Puntuación"}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-chart-1/10 to-chart-1/5 border-chart-1/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-chart-1/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-chart-1" />
            </div>
          </div>
          <p className="text-3xl font-bold text-chart-1">{stats?.totalScans || 0}</p>
          <p className="text-sm text-muted-foreground">{t("totalScans")}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-chart-2/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-chart-2" />
            </div>
          </div>
          <p className="text-3xl font-bold text-chart-2">{stats?.streak || 0}</p>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Day Streak" : "Días Seguidos"}</p>
        </Card>
      </div>

      {/* Streak Card */}
      <Card className="p-6 mb-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">{language === "en" ? "Current Streak" : "Racha Actual"}</h3>
            <p className="text-sm text-muted-foreground">{getStreakMessage(stats?.streak || 0)}</p>
          </div>
          <div className="text-5xl">🔥</div>
        </div>
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => {
            const isActive = stats && stats.streak > i
            return (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-secondary"}`}
              />
            )
          })}
        </div>
      </Card>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card className="p-6 mb-6 bg-card border-border">
          <h3 className="text-xl font-semibold mb-4">
            {language === "en" ? "Score Over Time" : "Puntuación en el Tiempo"}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(132, 250, 176)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(132, 250, 176)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 250, 176, 0.1)" />
              <XAxis
                dataKey="label"
                stroke="rgba(132, 250, 176, 0.5)"
                tick={{ fill: "rgba(132, 250, 176, 0.7)", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="rgba(132, 250, 176, 0.5)"
                tick={{ fill: "rgba(132, 250, 176, 0.7)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20, 25, 30, 0.95)",
                  border: "1px solid rgba(132, 250, 176, 0.3)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "rgb(132, 250, 176)" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="rgb(132, 250, 176)"
                strokeWidth={2}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Pose Performance */}
      {posePerformance.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">
            {language === "en" ? "Performance by Pose" : "Rendimiento por Pose"}
          </h3>
          {posePerformance.map((pose) => (
            <Card key={pose.pose} className="p-4 bg-card border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{t(pose.pose as any)}</p>
                  <p className="text-xs text-muted-foreground">
                    {pose.count} {language === "en" ? "attempts" : "intentos"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{pose.avgScore}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "en" ? "Best:" : "Mejor:"} {pose.bestScore}
                  </p>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pose.avgScore}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {recentScans.length === 0 && (
        <Card className="p-8 bg-card border-border border-dashed">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-semibold mb-2">
              {language === "en" ? "No Progress Data Yet" : "Sin Datos de Progreso Aún"}
            </p>
            <p className="text-sm">
              {language === "en"
                ? "Start analyzing your poses to track your progress over time."
                : "Comienza a analizar tus poses para rastrear tu progreso con el tiempo."}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
