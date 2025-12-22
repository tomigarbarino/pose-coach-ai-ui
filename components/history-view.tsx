"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Eye, Calendar, TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { getScans, deleteScan } from "@/lib/storage"
import type { ScanResult } from "@/lib/storage"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HistoryView() {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [scans, setScans] = useState<ScanResult[]>(() => getScans())
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)

  const handleDelete = (scanId: string) => {
    deleteScan(scanId)
    setScans(getScans())
    if (selectedScan?.id === scanId) {
      setSelectedScan(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-primary"
    if (score >= 70) return "text-chart-3"
    return "text-destructive"
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("history")}</h1>
        <p className="text-muted-foreground">
          {language === "en" ? "Review your past pose analyses" : "Revisa tus análisis de poses pasados"}
        </p>
      </div>

      {/* Scans List */}
      {scans.length > 0 ? (
        <div className="space-y-3">
          {scans.map((scan) => (
            <Card key={scan.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                  <div className="relative w-full h-full">
                    <Image
                      src={scan.thumbnail || "/placeholder.svg"}
                      alt={scan.pose}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{t(scan.pose as any)}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(scan.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(scan.score)}`}>{scan.score}</p>
                      <p className="text-xs text-muted-foreground">{language === "en" ? "score" : "puntuación"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)} className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      {language === "en" ? "View" : "Ver"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {language === "en" ? "Delete Scan?" : "¿Eliminar Escaneo?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === "en"
                              ? "This action cannot be undone. This will permanently delete this scan from your history."
                              : "Esta acción no se puede deshacer. Esto eliminará permanentemente este escaneo de tu historial."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{language === "en" ? "Cancel" : "Cancelar"}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(scan.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {language === "en" ? "Delete" : "Eliminar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 bg-card border-border border-dashed">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-semibold mb-2">{language === "en" ? "No History Yet" : "Sin Historial Aún"}</p>
            <p className="text-sm">
              {language === "en" ? "Your analyzed poses will appear here." : "Tus poses analizadas aparecerán aquí."}
            </p>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedScan && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedScan(null)}
        >
          <Card
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto bg-card border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t(selectedScan.pose as any)}</h2>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedScan.date)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedScan(null)}>
                  ✕
                </Button>
              </div>

              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                <div className="relative w-full h-full">
                  <Image
                    src={selectedScan.thumbnail || "/placeholder.svg"}
                    alt={selectedScan.pose}
                    fill
                    sizes="(max-width: 768px) 90vw, 512px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <span className="font-semibold">{language === "en" ? "Score" : "Puntuación"}</span>
                <span className={`text-3xl font-bold ${getScoreColor(selectedScan.score)}`}>{selectedScan.score}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{language === "en" ? "Feedback" : "Retroalimentación"}</h3>
                {selectedScan.feedback.map((item, index) => (
                  <div key={index} className="p-3 bg-secondary rounded-lg">
                    <p className="font-medium text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
