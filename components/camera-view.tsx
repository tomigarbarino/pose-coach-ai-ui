"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Circle, SwitchCamera, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PoseDetectorService } from "@/services/PoseDetector"
import { drawKeypoints, clearCanvas } from "@/utils/canvasDrawing"

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

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // MANTENER REFERENCIAS (NO ESTADOS) PARA EL BUCLE DE ANIMACIÓN
  const detectorRef = useRef<PoseDetectorService | null>(null)
  const loopRef = useRef<number | undefined>(undefined)

  // Inicializar Detector UNA SOLA VEZ
  useEffect(() => {
    const initDetector = async () => {
      try {
        detectorRef.current = PoseDetectorService.getInstance()
        await detectorRef.current.initialize()
        console.log('[CameraView] Detector inicializado')
      } catch (error) {
        console.error('[CameraView] Error al inicializar detector:', error)
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
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  // Bucle de Detección en Tiempo Real
  useEffect(() => {
    if (!stream || !videoRef.current || !overlayCanvasRef.current || !detectorRef.current) return

    const video = videoRef.current
    const canvas = overlayCanvasRef.current

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

    const loop = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && canvas.width > 0) {
        try {
          // 1. Estimar pose
          const pose = await detectorRef.current!.estimate(video)

          // 2. Limpiar canvas
          const ctx = canvas.getContext('2d')
          if (ctx) {
            clearCanvas(canvas)

            // 3. Dibujar skeleton si hay pose detectada
            if (pose && pose.keypoints.length > 0) {
              drawKeypoints(ctx, pose.keypoints, 0.3)
            }
          }
        } catch (error) {
          console.error('[CameraView] Error en detección:', error)
        }
      }

      loopRef.current = requestAnimationFrame(loop)
    }

    if (isPoseDetectionActive) {
      loop()
    }

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize)
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current)
      }
    }
  }, [stream, isPoseDetectionActive])

  const startCamera = async () => {
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
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

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

        {/* Skeleton guide overlay */}
        {stream && (
          <div className="relative z-10 h-[70vh] w-[90vw] max-w-md">
            <svg
              viewBox="0 0 200 300"
              className="w-full h-full opacity-30"
              style={{ filter: "drop-shadow(0 0 8px rgba(132, 250, 176, 0.4))" }}
            >
              {/* Simple skeleton wireframe */}
              <circle cx="100" cy="40" r="15" fill="none" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <line x1="100" y1="55" x2="100" y2="120" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <line x1="100" y1="70" x2="60" y2="110" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <line x1="100" y1="70" x2="140" y2="110" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <line x1="100" y1="120" x2="70" y2="200" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <line x1="100" y1="120" x2="130" y2="200" stroke="rgb(132, 250, 176)" strokeWidth="2" />
              <circle cx="60" cy="110" r="6" fill="rgb(132, 250, 176)" />
              <circle cx="140" cy="110" r="6" fill="rgb(132, 250, 176)" />
              <circle cx="70" cy="200" r="6" fill="rgb(132, 250, 176)" />
              <circle cx="130" cy="200" r="6" fill="rgb(132, 250, 176)" />
            </svg>

            {/* Alignment grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-primary/30" />
              ))}
            </div>
          </div>
        )}

        {/* Center crosshair */}
        {stream && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/60" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/60" />
          </div>
        )}
      </div>

      {/* Pose Selector */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {poses.map((pose) => (
            <Button
              key={pose}
              variant={selectedPose === pose ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedPose(pose)}
              className={
                selectedPose === pose ? "bg-primary text-primary-foreground whitespace-nowrap" : "whitespace-nowrap"
              }
            >
              {t(pose)}
            </Button>
          ))}
        </div>
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
