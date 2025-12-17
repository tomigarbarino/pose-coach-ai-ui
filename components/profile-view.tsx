"use client"

import { useState, useEffect } from "react"
import { User, Globe, Bell, Ruler, Moon, Info, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/i18n"
import { getProfile, getSettings, saveSettings } from "@/lib/storage"
import type { UserSettings } from "@/lib/storage"
import type { category } from "@/lib/category" // Import or declare the category variable

export default function ProfileView() {
  const { language, setLanguage } = useLanguage()
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key)

  const [settings, setSettingsState] = useState<UserSettings>({
    language: "en",
    units: "metric",
    notifications: {
      progress: true,
      tips: true,
      reminders: true,
    },
    appearance: {
      darkMode: true,
    },
    privacy: {
      shareProgress: false,
      analytics: true,
    },
  })

  const [profile, setProfile] = useState({
    totalScans: 0,
    averageScore: 0,
    streak: 0,
  })

  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  useEffect(() => {
    const storedSettings = getSettings()
    const storedProfile = getProfile()
    setSettingsState(storedSettings)
    setProfile({
      totalScans: storedProfile.totalScans,
      averageScore: storedProfile.averageScore,
      streak: storedProfile.streak,
    })
  }, [])

  const handleLanguageChange = (lang: "en" | "es") => {
    setLanguage(lang)
    const newSettings = { ...settings, language: lang }
    setSettingsState(newSettings)
    saveSettings(newSettings)
    setShowLanguageMenu(false)
  }

  const handleSettingToggle = (category: keyof UserSettings, key: string) => {
    const newSettings = { ...settings }
    if (category === "notifications" || category === "appearance" || category === "privacy") {
      newSettings[category] = {
        ...newSettings[category],
        [key]: !newSettings[category][key as keyof (typeof newSettings)[category]],
      }
    } else if (category === "units") {
      newSettings.units = newSettings.units === "metric" ? "imperial" : "metric"
    }
    setSettingsState(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("profile")}</h1>
        <p className="text-muted-foreground">
          {language === "en" ? "Manage your app preferences" : "Administra tus preferencias de la app"}
        </p>
      </div>

      {/* User Info Card */}
      <Card className="p-6 mb-6 bg-card/50 border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{language === "en" ? "Athlete User" : "Usuario Atleta"}</h2>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Bodybuilding Enthusiast" : "Entusiasta del Culturismo"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profile.totalScans}</p>
            <p className="text-xs text-muted-foreground">{t("totalScans")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profile.averageScore}</p>
            <p className="text-xs text-muted-foreground">{t("avgScore")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profile.streak}</p>
            <p className="text-xs text-muted-foreground">{language === "en" ? "Days Streak" : "Días Seguidos"}</p>
          </div>
        </div>
      </Card>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Language Settings */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "Preferences" : "Preferencias"}
          </h3>
          <Card className="p-4 bg-card/50 border-border">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto hover:bg-accent/50"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{language === "en" ? "Language" : "Idioma"}</p>
                  <p className="text-sm text-muted-foreground">{language === "en" ? "English" : "Español"}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${showLanguageMenu ? "rotate-90" : ""}`}
              />
            </Button>

            {showLanguageMenu && (
              <div className="mt-2 space-y-1 pl-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto hover:bg-accent/50"
                  onClick={() => handleLanguageChange("en")}
                >
                  <span>English</span>
                  {language === "en" && <Check className="w-5 h-5 text-primary" />}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto hover:bg-accent/50"
                  onClick={() => handleLanguageChange("es")}
                >
                  <span>Español</span>
                  {language === "es" && <Check className="w-5 h-5 text-primary" />}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Measurement Units */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "Measurements" : "Medidas"}
          </h3>
          <Card className="p-4 bg-card/50 border-border">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{language === "en" ? "Metric Units" : "Unidades Métricas"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "Use cm and kg instead of inches and lbs"
                      : "Usar cm y kg en lugar de pulgadas y lbs"}
                  </p>
                </div>
              </div>
              <Switch checked={settings.units === "metric"} onCheckedChange={() => handleSettingToggle("units", "")} />
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "Notifications" : "Notificaciones"}
          </h3>
          <Card className="p-4 bg-card/50 border-border space-y-4">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{language === "en" ? "Push Notifications" : "Notificaciones Push"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" ? "Receive tips and reminders" : "Recibir consejos y recordatorios"}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.progress}
                onCheckedChange={() => handleSettingToggle("notifications", "progress")}
              />
            </div>

            <div className="flex items-center justify-between p-2 border-t border-border/50 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">📳</span>
                </div>
                <div>
                  <p className="font-semibold">{language === "en" ? "Vibration Feedback" : "Vibración"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "en"
                      ? "Haptic feedback during analysis"
                      : "Retroalimentación háptica durante el análisis"}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.tips}
                onCheckedChange={() => handleSettingToggle("notifications", "tips")}
              />
            </div>
          </Card>
        </div>

        {/* Appearance */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "Appearance" : "Apariencia"}
          </h3>
          <Card className="p-4 bg-card/50 border-border">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{language === "en" ? "Dark Mode" : "Modo Oscuro"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" ? "Always enabled" : "Siempre activado"}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.appearance.darkMode}
                onCheckedChange={() => handleSettingToggle("appearance", "darkMode")}
              />
            </div>
          </Card>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "Privacy" : "Privacidad"}
          </h3>
          <Card className="p-4 bg-card/50 border-border">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">💾</span>
                </div>
                <div>
                  <p className="font-semibold">
                    {language === "en" ? "Save Pose History" : "Guardar Historial de Poses"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "en" ? "Store analysis results locally" : "Almacenar resultados localmente"}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.privacy.shareProgress}
                onCheckedChange={() => handleSettingToggle("privacy", "shareProgress")}
              />
            </div>
          </Card>
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {language === "en" ? "About" : "Acerca de"}
          </h3>
          <Card className="p-4 bg-card/50 border-border">
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{language === "en" ? "App Version" : "Versión de la App"}</p>
                  <p className="text-sm text-muted-foreground">v1.0.0</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground pb-8">
        <p>
          {language === "en" ? "Made with" : "Hecho con"} ❤️{" "}
          {language === "en" ? "for bodybuilders" : "para culturistas"}
        </p>
        <p className="mt-2">PoseCoach AI © 2025</p>
      </div>
    </div>
  )
}
