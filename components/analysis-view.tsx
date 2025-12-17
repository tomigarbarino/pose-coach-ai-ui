"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, Eye, Save, Loader2, Share2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { addScan } from "@/lib/storage"
import type { ScanResult } from "@/lib/storage"
import { analyzePoseFromImage, drawPoseOnCanvas } from "@/lib/pose-detection"
import type { PoseAnalysis } from "@/lib/pose-detection"

interface AnalysisViewProps {
  imageUrl: string
  onBack: () => void
}

export default function AnalysisView({ imageUrl, onBack }: AnalysisViewProps) {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [showSkeleton, setShowSkeleton] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysis, setAnalysis] = useState<PoseAnalysis | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    performAnalysis()
  }, [imageUrl])

  const performAnalysis = async () => {
    if (!imageRef.current) return

    setIsAnalyzing(true)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = async () => {
      const result = await analyzePoseFromImage(img)
      setAnalysis(result)
      setIsAnalyzing(false)

      if (canvasRef.current && result.keypoints.length > 0) {
        drawPoseOnCanvas(canvasRef.current, img, result.keypoints)
      }
    }

    img.onerror = () => {
      setIsAnalyzing(false)
      setAnalysis({
        score: 0,
        feedback: [
          {
            title: language === "en" ? "Image Load Error" : "Error al Cargar Imagen",
            description:
              language === "en"
                ? "Failed to load the captured image. Please try again."
                : "No se pudo cargar la imagen capturada. Por favor intenta de nuevo.",
            status: "error",
          },
        ],
        keypoints: [],
      })
    }
  }

  const handleSaveScan = () => {
    if (!analysis) return

    const scanResult: ScanResult = {
      id: Date.now().toString(),
      pose: "frontDoubleBiceps",
      score: analysis.score,
      date: new Date().toISOString(),
      thumbnail: imageUrl,
      feedback: analysis.feedback,
    }

    addScan(scanResult)
    setIsSaved(true)

    setTimeout(() => {
      setIsSaved(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (!analysis) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: "PoseCoach AI Analysis",
          text: `I scored ${analysis.score} on my pose analysis! Check out PoseCoach AI.`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("[v0] Share cancelled or failed")
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `I scored ${analysis.score} on PoseCoach AI! 💪`
      navigator.clipboard.writeText(shareText)
      alert(language === "en" ? "Result copied to clipboard!" : "¡Resultado copiado al portapapeles!")
    }
  }

  const getFeedbackIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-chart-3 flex-shrink-0" />
      case "error":
        return <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t("analysisResults")}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={!analysis}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSaveScan} disabled={isSaved || !analysis}>
              <Save className={`h-5 w-5 ${isSaved ? "text-primary" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Image with Skeleton Overlay */}
        <Card className="overflow-hidden bg-card border-border">
          <div className="relative aspect-[3/4] bg-secondary">
            <img
              ref={imageRef}
              src={imageUrl || "/placeholder.svg"}
              alt="Captured pose"
              className={`w-full h-full object-cover ${showSkeleton ? "hidden" : ""}`}
            />
            {showSkeleton && canvasRef.current && <canvas ref={canvasRef} className="w-full h-full object-contain" />}
            {!showSkeleton && <canvas ref={canvasRef} className="hidden" />}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="absolute bottom-4 right-4 shadow-lg"
              disabled={!analysis || analysis.keypoints.length === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showSkeleton ? t("hideAiSkeleton") : t("showAiSkeleton")}
            </Button>
          </div>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="p-8 bg-card border-border">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-semibold">
                {language === "en" ? "Analyzing your pose..." : "Analizando tu pose..."}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {language === "en"
                  ? "AI is evaluating your form and posture"
                  : "La IA está evaluando tu forma y postura"}
              </p>
            </div>
          </Card>
        )}

        {/* Score Card */}
        {!isAnalyzing && analysis && (
          <>
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">{t("overallScore")}</p>
                  <h2 className="text-5xl font-bold text-primary">{analysis.score}%</h2>
                </div>
                <div className="relative w-28 h-28">
                  <svg className="transform -rotate-90 w-28 h-28">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-secondary"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={301.59}
                      strokeDashoffset={301.59 * (1 - analysis.score / 100)}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{analysis.score}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("formQuality")}</span>
                  <span className="font-medium">
                    {analysis.score >= 85
                      ? t("excellent")
                      : analysis.score >= 70
                        ? language === "en"
                          ? "Good"
                          : "Bueno"
                        : language === "en"
                          ? "Needs Work"
                          : "Necesita Mejorar"}
                  </span>
                </div>
                <Progress value={analysis.score} className="h-2" />
              </div>
            </Card>

            {/* Feedback Section */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t("detailedFeedback")}</h3>

              <Accordion type="single" collapsible className="space-y-2">
                {analysis.feedback.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-border rounded-lg overflow-hidden bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
                      <div className="flex items-center gap-3 text-left">
                        {getFeedbackIcon(item.status)}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Compare Button */}
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              {t("compareWithPro")}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
