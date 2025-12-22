"use client"

import { useState, useEffect } from "react"
import DashboardView from "@/components/dashboard-view"
import CameraView from "@/components/camera-view"
import AnalysisView from "@/components/analysis-view"
import BottomNav from "@/components/bottom-nav"
import ProfileView from "@/components/profile-view"
import HistoryView from "@/components/history-view"
import SocialView from "@/components/social-view"
import Onboarding from "@/components/onboarding"
import { useLanguage } from "@/lib/language-context"
import { initializeStorage } from "@/lib/storage"

type View = "home" | "camera" | "analysis" | "history" | "profile" | "social"

export default function PoseCoachApp() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedPose, setSelectedPose] = useState<string>("frontDoubleBiceps")
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const { language } = useLanguage()

  useEffect(() => {
    initializeStorage()
    // Verificar el estado de onboarding solo en el cliente después de la hidratación
    const onboardingComplete = localStorage.getItem("posecoach_onboarding_complete")
    setShowOnboarding(!onboardingComplete)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem("posecoach_onboarding_complete", "true")
    setShowOnboarding(false)
  }

  const handleAnalyzePose = () => {
    setCurrentView("camera")
  }

  const handleCapture = (imageUrl: string, pose: string) => {
    setCapturedImage(imageUrl)
    setSelectedPose(pose)
    setCurrentView("analysis")
  }

  const handleBackToHome = () => {
    setCurrentView("home")
    setCapturedImage(null)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} language={language} />
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-auto pb-20">
          {currentView === "home" && <DashboardView onAnalyzePose={handleAnalyzePose} />}
          {currentView === "camera" && <CameraView onCapture={handleCapture} onBack={handleBackToHome} />}
          {currentView === "analysis" && capturedImage && (
            <AnalysisView imageUrl={capturedImage} selectedPose={selectedPose} onBack={handleBackToHome} />
          )}
          {currentView === "history" && <HistoryView />}
          {currentView === "profile" && <ProfileView />}
          {currentView === "social" && <SocialView />}
        </div>

        {/* Bottom Navigation */}
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </main>
  )
}
