"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, TrendingUp, Users, Award, ChevronRight } from "lucide-react"

interface OnboardingProps {
  onComplete: () => void
  language: "en" | "es"
}

export default function Onboarding({ onComplete, language }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Camera,
      title: language === "en" ? "Capture Your Pose" : "Captura Tu Pose",
      description:
        language === "en"
          ? "Use your camera to take photos of your bodybuilding poses with real-time skeleton guides to help you align perfectly."
          : "Usa tu cámara para tomar fotos de tus poses de culturismo con guías de esqueleto en tiempo real para ayudarte a alinearte perfectamente.",
      color: "from-primary/20 to-primary/5",
    },
    {
      icon: TrendingUp,
      title: language === "en" ? "Get AI Analysis" : "Obtén Análisis IA",
      description:
        language === "en"
          ? "Our advanced AI analyzes your form, posture, and symmetry, providing detailed feedback on each aspect of your pose."
          : "Nuestra IA avanzada analiza tu forma, postura y simetría, proporcionando retroalimentación detallada en cada aspecto de tu pose.",
      color: "from-chart-1/20 to-chart-1/5",
    },
    {
      icon: Award,
      title: language === "en" ? "Track Progress" : "Rastrea Tu Progreso",
      description:
        language === "en"
          ? "Monitor your improvement over time with detailed charts, streak tracking, and performance metrics for each pose type."
          : "Monitorea tu mejora con el tiempo con gráficos detallados, seguimiento de rachas y métricas de rendimiento para cada tipo de pose.",
      color: "from-chart-3/20 to-chart-3/5",
    },
    {
      icon: Users,
      title: language === "en" ? "Join Community" : "Únete a la Comunidad",
      description:
        language === "en"
          ? "Connect with fellow bodybuilders, share your progress, participate in challenges, and get inspired by the community."
          : "Conecta con otros culturistas, comparte tu progreso, participa en desafíos e inspírate con la comunidad.",
      color: "from-chart-2/20 to-chart-2/5",
    },
  ]

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep ? "w-8 bg-primary" : "w-2 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <Card
          className={`p-8 bg-gradient-to-br ${currentStepData.color} border-border animate-in fade-in slide-in-from-bottom-4 duration-500`}
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in duration-700 delay-100">
              <Icon className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <h2 className="text-3xl font-bold">{currentStepData.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{currentStepData.description}</p>
            </div>
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3 animate-in fade-in duration-500 delay-300">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 h-12 text-muted-foreground hover:text-foreground"
          >
            {language === "en" ? "Skip" : "Saltar"}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {isLastStep ? (
              language === "en" ? (
                "Get Started"
              ) : (
                "Comenzar"
              )
            ) : (
              <>
                {language === "en" ? "Next" : "Siguiente"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
