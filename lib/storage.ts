// Storage utilities for PoseCoach AI

export interface UserProfile {
  name: string
  email: string
  totalScans: number
  averageScore: number
  streak: number
  memberSince: string
}

export interface ScanResult {
  id: string
  pose: string
  score: number
  date: string
  thumbnail?: string
  feedback: {
    title: string
    description: string
    status: "success" | "warning" | "error"
  }[]
}

export interface UserSettings {
  language: "en" | "es"
  units: "metric" | "imperial"
  notifications: {
    progress: boolean
    tips: boolean
    reminders: boolean
  }
  appearance: {
    darkMode: boolean
  }
  privacy: {
    shareProgress: boolean
    analytics: boolean
  }
}

export interface UserStats {
  totalScans: number
  averageScore: number
  streak: number
  bestPose: string
  bestScore: number
  lastScanDate: string
  scanHistory: {
    date: string
    score: number
  }[]
}

// Storage keys
const STORAGE_KEYS = {
  PROFILE: "posecoach_profile",
  SCANS: "posecoach_scans",
  SETTINGS: "posecoach_settings",
  STATS: "posecoach_stats",
}

// Default values
const DEFAULT_PROFILE: UserProfile = {
  name: "Athlete",
  email: "",
  totalScans: 0,
  averageScore: 0,
  streak: 0,
  memberSince: new Date().toISOString(),
}

const DEFAULT_SETTINGS: UserSettings = {
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
}

const DEFAULT_STATS: UserStats = {
  totalScans: 0,
  averageScore: 0,
  streak: 0,
  bestPose: "",
  bestScore: 0,
  lastScanDate: "",
  scanHistory: [],
}

// Helper functions
function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

// Profile functions
export function getProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE
  const profile = localStorage.getItem(STORAGE_KEYS.PROFILE)
  return safeJsonParse(profile, DEFAULT_PROFILE)
}

export function saveProfile(profile: Partial<UserProfile>): void {
  if (typeof window === "undefined") return
  const currentProfile = getProfile()
  const updatedProfile = { ...currentProfile, ...profile }
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile))
}

// Scans functions
export function getScans(): ScanResult[] {
  if (typeof window === "undefined") return []
  const scans = localStorage.getItem(STORAGE_KEYS.SCANS)
  return safeJsonParse(scans, [])
}

export function addScan(scan: ScanResult): void {
  if (typeof window === "undefined") return
  const scans = getScans()
  scans.unshift(scan) // Add to beginning
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans))

  // Update stats
  updateStatsAfterScan(scan)
}

export function deleteScan(scanId: string): void {
  if (typeof window === "undefined") return
  const scans = getScans()
  const filtered = scans.filter((s) => s.id !== scanId)
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(filtered))

  // Recalculate stats
  recalculateStats(filtered)
}

// Settings functions
export function getSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  return safeJsonParse(settings, DEFAULT_SETTINGS)
}

export function saveSettings(settings: Partial<UserSettings>): void {
  if (typeof window === "undefined") return
  const currentSettings = getSettings()
  const updatedSettings = { ...currentSettings, ...settings }
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
}

// Stats functions
export function getStats(): UserStats {
  if (typeof window === "undefined") return DEFAULT_STATS
  const stats = localStorage.getItem(STORAGE_KEYS.STATS)
  return safeJsonParse(stats, DEFAULT_STATS)
}

function updateStatsAfterScan(scan: ScanResult): void {
  const stats = getStats()
  const scans = getScans()

  // Calculate total scans and average
  stats.totalScans = scans.length
  const totalScore = scans.reduce((sum, s) => sum + s.score, 0)
  stats.averageScore = Math.round(totalScore / scans.length)

  // Update best score
  if (scan.score > stats.bestScore) {
    stats.bestScore = scan.score
    stats.bestPose = scan.pose
  }

  // Update streak
  stats.lastScanDate = scan.date
  updateStreak(stats, scan.date)

  // Add to history (keep last 30 days)
  stats.scanHistory.push({ date: scan.date, score: scan.score })
  if (stats.scanHistory.length > 30) {
    stats.scanHistory = stats.scanHistory.slice(-30)
  }

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))

  // Update profile stats
  saveProfile({
    totalScans: stats.totalScans,
    averageScore: stats.averageScore,
    streak: stats.streak,
  })
}

function recalculateStats(scans: ScanResult[]): void {
  const stats = getStats()

  if (scans.length === 0) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS))
    saveProfile({
      totalScans: 0,
      averageScore: 0,
      streak: 0,
    })
    return
  }

  stats.totalScans = scans.length
  const totalScore = scans.reduce((sum, s) => sum + s.score, 0)
  stats.averageScore = Math.round(totalScore / scans.length)

  // Find best score
  const best = scans.reduce((max, s) => (s.score > max.score ? s : max), scans[0])
  stats.bestScore = best.score
  stats.bestPose = best.pose

  // Recalculate streak
  stats.lastScanDate = scans[0].date
  stats.scanHistory = scans.slice(0, 30).map((s) => ({ date: s.date, score: s.score }))

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))

  saveProfile({
    totalScans: stats.totalScans,
    averageScore: stats.averageScore,
    streak: stats.streak,
  })
}

function updateStreak(stats: UserStats, scanDate: string): void {
  const today = new Date(scanDate)
  const lastScan = stats.lastScanDate ? new Date(stats.lastScanDate) : null

  if (!lastScan) {
    stats.streak = 1
    return
  }

  const daysDiff = Math.floor((today.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    // Same day, don't change streak
    return
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    stats.streak += 1
  } else {
    // Streak broken, reset to 1
    stats.streak = 1
  }
}

// Initialize storage with default values if empty
export function initializeStorage(): void {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE))
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.SCANS)) {
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify([]))
  }
}

// Export data for backup
export function exportData(): string {
  if (typeof window === "undefined") return "{}"

  return JSON.stringify(
    {
      profile: getProfile(),
      scans: getScans(),
      settings: getSettings(),
      stats: getStats(),
      exportDate: new Date().toISOString(),
    },
    null,
    2,
  )
}

// Import data from backup
export function importData(jsonData: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const data = JSON.parse(jsonData)

    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile))
    if (data.scans) localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(data.scans))
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings))
    if (data.stats) localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats))

    return true
  } catch {
    return false
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEYS.PROFILE)
  localStorage.removeItem(STORAGE_KEYS.SCANS)
  localStorage.removeItem(STORAGE_KEYS.SETTINGS)
  localStorage.removeItem(STORAGE_KEYS.STATS)

  initializeStorage()
}
