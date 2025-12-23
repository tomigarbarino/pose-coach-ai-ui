"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Circle, SwitchCamera, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PoseDetectorService } from "@/services/PoseDetector"
import type { PoseDetectorBackend, PoseDetectorInitState } from "@/services/PoseDetector"
import { drawKeypoints, clearCanvas } from "@/utils/canvasDrawing"
import { analyzeFrontDoubleBicep } from "@/analysis/strategies/FrontDoubleBicep"
import type { PoseEvaluationResult } from "@/types/analysis"

interface CameraViewProps {
  onCapture: (imageUrl: string, selectedPose: string) => void
  onBack: () => void
}

const poses = ["frontDoubleBiceps", "latSpread", "sideChest", "backDoubleBiceps"] as const
type PoseType = typeof poses[number]

export default function CameraView({ onCapture, onBack }: CameraViewProps) {
  const { language } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [selectedPose, setSelectedPose] = useState<PoseType>(poses[0])
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isPoseDetectionActive, setIsPoseDetectionActive] = useState(false)

  // Estado del modelo + feedback en vivo
  const [detectorReady, setDetectorReady] = useState(false)
  const [detectorStatus, setDetectorStatus] = useState<{
    state: PoseDetectorInitState
    backend: PoseDetectorBackend | null
    error: string | null
  }>(() => ({
    state: "idle",
    backend: null,
    error: null,
  }))
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null)
  const [liveAnalysis, setLiveAnalysis] = useState<PoseEvaluationResult | null>(null)

  // QUICK WINS: Estado para tracking de progreso y tiempo
  const [previousScore, setPreviousScore] = useState<number | null>(null)
  const [timeInOptimalRange, setTimeInOptimalRange] = useState<number>(0)
  const [showProgressCelebration, setShowProgressCelebration] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // MANTENER REFERENCIAS (NO ESTADOS) PARA EL BUCLE DE ANIMACIÓN
  const detectorRef = useRef<PoseDetectorService | null>(null)
  const loopRef = useRef<number | undefined>(undefined)
  const isEstimatingRef = useRef(false)
  const lastEstimateTimeRef = useRef(0)

  // Inicializar Detector UNA SOLA VEZ
  useEffect(() => {
    const initDetector = async () => {
      try {
        detectorRef.current = PoseDetectorService.getInstance()
        setDetectorStatus({ state: "initializing", backend: null, error: null })
        await detectorRef.current.initialize()
        const status = detectorRef.current.getStatus()
        setDetectorStatus(status)
        setDetectorReady(true)
        console.log('[CameraView] Detector inicializado')
      } catch (error) {
        console.error('[CameraView] Error al inicializar detector:', error)
        setDetectorStatus({
          state: "error",
          backend: null,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    initDetector()

    return () => {
      // Cleanup: cancelar el bucle de animación
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current)
      }
    }
  }, [])

  useEffect(() => {
    streamRef.current = stream
  }, [stream])

  const stopCamera = useCallback(() => {
    const currentStream = streamRef.current
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (err) {
      console.error("[v0] Camera error:", err)
      setHasPermission(false)
      setError(
        language === "en"
          ? "Camera access denied. Please allow camera permissions to use this feature."
          : "Acceso a la cámara denegado. Por favor permite los permisos de cámara para usar esta función.",
      )
    }
  }, [facingMode, language])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Bucle de Detección en Tiempo Real
  useEffect(() => {
    if (!stream || !videoRef.current || !overlayCanvasRef.current || !detectorReady) return
    if (!detectorRef.current) return

    const video = videoRef.current
    const canvas = overlayCanvasRef.current
    const detector = detectorRef.current

    // Ajustar tamaño del canvas al video
    const updateCanvasSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        setIsPoseDetectionActive(true)
      }
    }

    video.addEventListener('loadedmetadata', updateCanvasSize)
    updateCanvasSize()

    const STRATEGIES: Record<string, (keypoints: any[]) => PoseEvaluationResult> = {
      frontDoubleBiceps: analyzeFrontDoubleBicep,
    }

    const loop = async (ts: number) => {
      // Throttle: ~20 FPS (optimizado para MoveNet Lightning)
      if (ts - lastEstimateTimeRef.current < 50) {
        loopRef.current = requestAnimationFrame(loop)
        return
      }
      lastEstimateTimeRef.current = ts

      // Evitar solapar inferencias
      if (isEstimatingRef.current) {
        loopRef.current = requestAnimationFrame(loop)
        return
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA && canvas.width > 0) {
        isEstimatingRef.current = true
        try {
          const pose = await detector.estimate(video)

          const ctx = canvas.getContext("2d")
          if (ctx) {
            clearCanvas(canvas)

            if (pose && pose.keypoints.length > 0) {
              // Confianza/visibilidad
              const visible = pose.keypoints.filter((kp) => (kp.score ?? 0) > 0.3).length
              const ratio = visible / pose.keypoints.length
              setLiveConfidence(Math.round(ratio * 100))

              // Dibujar skeleton
              drawKeypoints(ctx, pose.keypoints, 0.3)

              // Feedback en vivo (por ahora implementado para frontDoubleBiceps)
              const strategy = STRATEGIES[selectedPose]
              if (strategy && ratio > 0.4) {
                const result = strategy(pose.keypoints)
                setLiveAnalysis(result)

                // QUICK WIN 2 & 3: Tracking de progreso y tiempo
                const currentScore = result.score

                // Quick Win 3: Detectar mejora y celebrar
                if (previousScore !== null && currentScore > previousScore && currentScore >= 70) {
                  const improvement = currentScore - previousScore
                  if (improvement >= 10) {
                    setShowProgressCelebration("¡Bien! Sigue así ⬆️")
                    setTimeout(() => setShowProgressCelebration(null), 2000)
                  }
                }
                setPreviousScore(currentScore)

                // Quick Win 2: Contador de tiempo en rango óptimo
                if (currentScore >= 85) {
                  setTimeInOptimalRange(prev => Math.min(prev + 1, 30)) // Max 3 segundos (30 frames a 10 FPS)
                } else {
                  setTimeInOptimalRange(0)
                }
              } else {
                setLiveAnalysis(null)
                setTimeInOptimalRange(0)
              }
            } else {
              setLiveConfidence(0)
              setLiveAnalysis(null)
            }
          }
        } catch (error) {
          console.error("[CameraView] Error en detección:", error)
          setLiveConfidence(null)
          setLiveAnalysis(null)
        } finally {
          isEstimatingRef.current = false
        }
      }

      loopRef.current = requestAnimationFrame(loop)
    }

    if (isPoseDetectionActive) {
      loopRef.current = requestAnimationFrame(loop)
    }

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize)
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current)
      }
    }
  }, [stream, detectorReady, isPoseDetectionActive, selectedPose])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageUrl = canvas.toDataURL("image/jpeg", 0.9)

      setTimeout(() => {
        setIsCapturing(false)
        stopCamera()
        onCapture(imageUrl, selectedPose)
      }, 300)
    }
  }

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const handleBack = () => {
    stopCamera()
    onBack()
  }

  return (
    <div className="relative h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative h-full w-full flex items-center justify-center">
        {hasPermission === false && error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

        {/* Overlay canvas for pose detection */}
        <canvas 
          ref={overlayCanvasRef} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <canvas ref={canvasRef} className="hidden" />

        {/* Skeleton guide overlay - MODO GIMNASIO (Alto Contraste) */}
        {stream && (
          <div className="relative z-10 h-[70vh] w-[90vw] max-w-md">
            <svg
              viewBox="0 0 200 300"
              className="w-full h-full opacity-70"
              style={{ filter: "drop-shadow(0 0 12px rgba(255, 215, 0, 0.8))" }}
            >
              {/* Simple skeleton wireframe - AMARILLO NEÓN para luces fuertes */}
              <circle cx="100" cy="40" r="15" fill="none" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <line x1="100" y1="55" x2="100" y2="120" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <line x1="100" y1="70" x2="60" y2="110" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <line x1="100" y1="70" x2="140" y2="110" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <line x1="100" y1="120" x2="70" y2="200" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <line x1="100" y1="120" x2="130" y2="200" stroke="rgb(255, 215, 0)" strokeWidth="3" />
              <circle cx="60" cy="110" r="7" fill="rgb(255, 215, 0)" />
              <circle cx="140" cy="110" r="7" fill="rgb(255, 215, 0)" />
              <circle cx="70" cy="200" r="7" fill="rgb(255, 215, 0)" />
              <circle cx="130" cy="200" r="7" fill="rgb(255, 215, 0)" />
            </svg>

            {/* Alignment grid - Alto contraste */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-yellow-400/40" />
              ))}
            </div>
          </div>
        )}

        {/* Center crosshair - Alto contraste */}
        {stream && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400/70 shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400/70 shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
          </div>
        )}
      </div>

      {/* Pose Selector */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {poses.map((pose) => (
            <Button
              key={pose}
              variant={selectedPose === pose ? "default" : "secondary"}
              onClick={() => setSelectedPose(pose)}
              className={`min-h-[48px] px-6 py-3 text-base font-semibold whitespace-nowrap ${
                selectedPose === pose 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40" 
                  : "bg-secondary/80 backdrop-blur"
              }`}
            >
              {t(pose)}
            </Button>
          ))}
        </div>

        {/* Live model + feedback - MODO GIMNASIO */}
        {stream && (
          <div className="mt-3">
            {/* MODO FOCUS: Feedback principal GIGANTE cuando hay análisis */}
            {selectedPose === "frontDoubleBiceps" && liveAnalysis && liveAnalysis.score > 0 ? (
              <div className="rounded-2xl bg-black/70 backdrop-blur-xl border-2 border-yellow-400/50 p-6 text-white shadow-2xl">
                {/* Score GIGANTE - Legible a 2-3 metros */}
                <div className="text-center mb-4">
                  <div className="text-6xl font-black tracking-tight mb-2" style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
                    {liveAnalysis.score}
                    <span className="text-5xl text-yellow-400">%</span>
                  </div>
                  <div className="text-xs uppercase tracking-widest text-yellow-400/80 font-semibold">
                    {language === "en" ? "LIVE SCORE" : "PUNTAJE EN VIVO"}
                  </div>
                </div>

                {/* QUICK WIN 2: Contador de Tiempo en Rango Óptimo */}
                {liveAnalysis.score >= 85 && timeInOptimalRange > 0 ? (
                  <div className="text-center py-6 px-4 bg-gradient-to-r from-green-500/20 to-yellow-400/20 rounded-xl border-2 border-green-400/50 mb-4 animate-pulse">
                    <p className="text-3xl font-black tracking-wide mb-2">
                      ¡MANTÉN! 🔥
                    </p>
                    <div className="text-5xl font-black text-green-400">
                      {Math.ceil((30 - timeInOptimalRange) / 10)}
                    </div>
                    <p className="text-sm text-white/80 mt-1">
                      {language === "en" ? "seconds..." : "segundos..."}
                    </p>
                  </div>
                ) : (
                  /* Feedback principal GIGANTE */
                  <div className="text-center py-4 px-3 bg-yellow-400/10 rounded-xl border border-yellow-400/30">
                    <p className="text-2xl font-bold leading-tight tracking-wide">
                      {liveAnalysis.feedback[0]?.title ?? ""}
                    </p>
                  </div>
                )}

                {/* QUICK WIN 3: Celebración de Progreso */}
                {showProgressCelebration && (
                  <div className="mt-3 text-center py-2 px-4 bg-green-500/20 rounded-lg border border-green-400/50 animate-in fade-in duration-300">
                    <p className="text-lg font-bold text-green-400">
                      {showProgressCelebration}
                    </p>
                  </div>
                )}

                {/* Confianza (pequeño pero visible) */}
                <div className="mt-3 text-center text-sm text-white/60">
                  {language === "en" ? "Confidence" : "Confianza"}: {liveConfidence ?? "--"}%
                </div>
              </div>
            ) : (
              /* MODO INFO: Panel compacto cuando NO hay análisis activo */
              <div className="rounded-lg bg-black/50 backdrop-blur border border-white/10 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-semibold">
                      {language === "en" ? "Model" : "Modelo"}:
                    </span>{" "}
                    {detectorStatus.state === "ready"
                      ? language === "en"
                        ? "Ready"
                        : "Listo"
                      : detectorStatus.state === "initializing"
                        ? language === "en"
                          ? "Loading..."
                          : "Cargando..."
                        : detectorStatus.state === "error"
                          ? language === "en"
                            ? "Error"
                            : "Error"
                          : language === "en"
                            ? "Idle"
                            : "Inactivo"}
                    {detectorStatus.backend ? ` (${detectorStatus.backend})` : ""}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{language === "en" ? "Confidence" : "Confianza"}:</span>{" "}
                    {liveConfidence === null ? "--" : `${liveConfidence}%`}
                  </div>
                </div>

                {detectorStatus.state === "error" && detectorStatus.error && (
                  <div className="mt-2 text-sm text-red-300">
                    {detectorStatus.error}
                  </div>
                )}

                {selectedPose !== "frontDoubleBiceps" && (
                  <div className="mt-2 text-sm text-white/70 text-center">
                    {language === "en"
                      ? "Live coaching available for Front Double Biceps"
                      : "Coaching en vivo disponible para Doble Bíceps Frontal"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-8 px-4 pt-8">
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full text-white hover:bg-white/20"
            onClick={handleSwitchCamera}
            disabled={!stream}
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            onClick={handleCapture}
            disabled={isCapturing || !stream}
            className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 relative shadow-lg shadow-primary/40 disabled:opacity-50"
          >
            <Circle className="h-16 w-16" fill="currentColor" />
            {isCapturing && <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />}
          </Button>

          <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full text-white hover:bg-white/20 invisible">
            <Camera className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-center text-white/80 text-sm mt-4">{t("alignBody")}</p>
      </div>
    </div>
  )
}
