export type Language = "en" | "es"

export const translations = {
  en: {
    // Dashboard
    appName: "POSECOACH AI",
    readyToPerfect: "Ready to perfect",
    yourPose: "your pose?",
    aiPoweredAnalysis: "AI-powered analysis for champion physiques",
    analyzePose: "Analyze Pose",
    recentScans: "Recent Scans",
    viewAll: "View All",
    score: "Score",
    totalScans: "Total Scans",
    avgScore: "Avg Score",

    // Camera
    alignBody: "Align your body with the guide",

    // Analysis
    analysisResults: "Analysis Results",
    overallScore: "Overall Score",
    formQuality: "Form Quality",
    excellent: "Excellent",
    detailedFeedback: "Detailed Feedback",
    showAiSkeleton: "Show AI Skeleton",
    hideAiSkeleton: "Hide AI Skeleton",
    compareWithPro: "Compare with Pro Reference",

    // Bottom Nav
    home: "Home",
    history: "History",
    profile: "Profile",

    // Poses
    frontDoubleBiceps: "Front Double Biceps",
    latSpread: "Lat Spread",
    sideChest: "Side Chest",
    backDoubleBiceps: "Back Double Biceps",

    // Feedback
    shoulderPosition: "Shoulder Position",
    excellentShoulder: "Excellent shoulder spread and symmetry",
    rightElbow: "Right Elbow",
    liftElbow: "Lift right elbow 2-3 inches higher for better arm definition",
    coreEngagement: "Core Engagement",
    strongCore: "Strong abdominal control and posture",
    waistTwist: "Waist Twist",
    rotateTorso: "Rotate torso 5° clockwise for optimal lat visibility",
    legPositioning: "Leg Positioning",
    perfectStance: "Perfect stance width and weight distribution",
  },
  es: {
    // Dashboard
    appName: "POSECOACH AI",
    readyToPerfect: "¿Listo para perfeccionar",
    yourPose: "tu pose?",
    aiPoweredAnalysis: "Análisis impulsado por IA para físicos de campeones",
    analyzePose: "Analizar Pose",
    recentScans: "Escaneos Recientes",
    viewAll: "Ver Todos",
    score: "Puntuación",
    totalScans: "Total de Escaneos",
    avgScore: "Puntuación Promedio",

    // Camera
    alignBody: "Alinea tu cuerpo con la guía",

    // Analysis
    analysisResults: "Resultados del Análisis",
    overallScore: "Puntuación General",
    formQuality: "Calidad de Forma",
    excellent: "Excelente",
    detailedFeedback: "Retroalimentación Detallada",
    showAiSkeleton: "Mostrar Esqueleto IA",
    hideAiSkeleton: "Ocultar Esqueleto IA",
    compareWithPro: "Comparar con Referencia Pro",

    // Bottom Nav
    home: "Inicio",
    history: "Historial",
    profile: "Perfil",

    // Poses
    frontDoubleBiceps: "Doble Bíceps Frontal",
    latSpread: "Extensión de Dorsales",
    sideChest: "Pecho Lateral",
    backDoubleBiceps: "Doble Bíceps de Espalda",

    // Feedback
    shoulderPosition: "Posición de Hombros",
    excellentShoulder: "Excelente extensión y simetría de hombros",
    rightElbow: "Codo Derecho",
    liftElbow: "Levanta el codo derecho 2-3 pulgadas más para mejor definición del brazo",
    coreEngagement: "Activación del Core",
    strongCore: "Fuerte control abdominal y postura",
    waistTwist: "Giro de Cintura",
    rotateTorso: "Rota el torso 5° en sentido horario para óptima visibilidad de dorsales",
    legPositioning: "Posicionamiento de Piernas",
    perfectStance: "Ancho de postura y distribución de peso perfectos",
  },
}

export function getTranslation(language: Language, key: keyof typeof translations.en): string {
  return translations[language][key]
}
