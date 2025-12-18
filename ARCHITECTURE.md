# PoseCoach AI - Arquitectura Refactorizada

## 📐 Estructura de la Arquitectura

### 1. **Servicio Singleton: PoseDetectorService**

**Ubicación:** `services/PoseDetector.ts`

**Responsabilidad:** Gestionar la instancia única del modelo de detección de poses (PoseNet).

**Ventajas:**

- ✅ Evita cargar el modelo múltiples veces (ahorro de memoria)
- ✅ Inicialización lazy (solo se carga cuando se necesita)
- ✅ Una sola fuente de verdad para el estado del detector

**Uso:**

```typescript
const detector = PoseDetectorService.getInstance();
await detector.initialize();
const pose = await detector.estimate(videoElement);
```

### 2. **Estrategias de Análisis**

**Ubicación:** `analysis/strategies/`

**Responsabilidad:** Evaluaciones matemáticas específicas para cada pose de bodybuilding.

**Implementadas:**

- ✅ `FrontDoubleBicep.ts` - Análisis de pose de bíceps frontal doble

**Pendientes:**

- 🔲 `LatSpread.ts` - Expansión dorsal
- 🔲 `SideChest.ts` - Pecho lateral
- 🔲 `BackDoubleBiceps.ts` - Bíceps trasero doble

**Criterios Evaluados (Front Double Bicep):**

1. Alineación de hombros (horizontal)
2. Ángulo de codos (ideal: 90°)
3. Altura de muñecas (nivel de hombros)
4. Visibilidad general del cuerpo

### 3. **Utilidades de Geometría**

**Ubicación:** `utils/geometry.ts`

**Funciones puras para cálculos matemáticos:**

- `calculateDistance(p1, p2)` - Distancia euclidiana
- `calculateAngle(p1, p2, p3)` - Ángulo entre 3 puntos
- `calculateMidpoint(p1, p2)` - Punto medio
- `isKeypointVisible(kp, minScore)` - Validar confianza

**Uso:**

```typescript
const elbowAngle = calculateAngle(shoulder, elbow, wrist);
if (elbowAngle >= 75 && elbowAngle <= 105) {
  // Ángulo perfecto
}
```

### 4. **Utilidades de Dibujo**

**Ubicación:** `utils/canvasDrawing.ts`

**Responsabilidad:** Renderizado del skeleton overlay en tiempo real.

**Funciones:**

- `drawKeypoints(ctx, keypoints, minScore)` - Dibuja puntos y conexiones
- `clearCanvas(canvas)` - Limpia el canvas
- `drawImageOnCanvas(canvas, image)` - Dibuja imagen de fondo

**Estilo Visual:**

- Color: `rgb(132, 250, 176)` (Verde neón)
- Puntos: 8px de radio
- Líneas: 3px de grosor
- Umbral de confianza: 0.3 (30%)

### 5. **Interfaces y Tipos**

**Ubicación:** `types/analysis.ts`

```typescript
interface PoseEvaluationResult {
  score: number              // 0-100
  feedback: FeedbackItem[]   // Array de retroalimentación
  keypoints: Array<{...}>    // Keypoints detectados
}

interface FeedbackItem {
  title: string
  description: string
  status: 'success' | 'warning' | 'error'
}
```

## 🎯 Flujo de Datos

### **CameraView (Tiempo Real)**

```
1. Usuario abre cámara
2. PoseDetectorService inicializa UNA VEZ
3. Loop de requestAnimationFrame:
   ├─> estimate(video) → pose
   ├─> clearCanvas()
   └─> drawKeypoints() → skeleton overlay
4. Usuario captura foto
5. Pasa imageUrl + selectedPose → AnalysisView
```

### **AnalysisView (Análisis Estático)**

```
1. Recibe imageUrl + selectedPose
2. PoseDetectorService.estimate(image)
3. SELECCIONA estrategia según selectedPose:
   └─> frontDoubleBiceps → analyzeFrontDoubleBicep()
4. Estrategia ejecuta cálculos geométricos
5. Retorna PoseEvaluationResult con score y feedback
6. Dibuja skeleton final en canvas con imagen
```

## 🔧 Configuración del Modelo

**Modelo Actual:** PoseNet (MobileNetV1)

**Configuración:**

```typescript
{
  architecture: 'MobileNetV1',
  outputStride: 16,
  inputResolution: { width: 257, height: 257 },
  multiplier: 0.75
}
```

**Ventajas de PoseNet:**

- ✅ Ligero (~10MB)
- ✅ Rápido en dispositivos móviles
- ✅ 17 keypoints estándar
- ✅ Compatible con imágenes y video

## 📋 Próximos Pasos (To-Do List)

### Inmediato

- [x] Crear servicio Singleton
- [x] Implementar utilidades de geometría
- [x] Implementar estrategia Front Double Bicep
- [x] Refactorizar CameraView
- [x] Refactorizar AnalysisView
- [x] Pasar selectedPose entre vistas

### Corto Plazo

- [ ] Implementar estrategia Lat Spread
- [ ] Implementar estrategia Side Chest
- [ ] Implementar estrategia Back Double Biceps
- [ ] Agregar indicador de carga del modelo
- [ ] Optimizar performance (reduce detection fps si es necesario)
- [ ] Añadir guías dinámicas en la cámara según pose seleccionada

### Mejoras Futuras

- [ ] Guardar historial de análisis con gráficas de progreso
- [ ] Comparación con poses profesionales (overlay)
- [ ] Modo "Entrenador Virtual" con feedback en vivo
- [ ] Exportar reporte PDF con análisis detallado
- [ ] Integración con wearables para datos adicionales

## 🎨 Mejoras UX Mantenidas

### Guía Visual Estática (CameraView)

```tsx
<svg viewBox="0 0 200 300" className="opacity-30">
  {/* Skeleton de referencia */}
</svg>
```

**Por qué es importante:** Ayuda al usuario a posicionarse ANTES de que el modelo detecte.

### Delay de Captura (300ms)

```typescript
setTimeout(() => {
  onCapture(imageUrl, selectedPose);
}, 300);
```

**Por qué es importante:** Evita que el usuario mueva el teléfono justo al hacer clic.

### Grid de Alineación

```tsx
<div className="grid grid-cols-3 grid-rows-3 opacity-20">
  {/* 9 cuadrículas */}
</div>
```

**Por qué es importante:** Ayuda a centrar el cuerpo y mantener simetría.

## 🐛 Debugging Tips

### Si no se ve el skeleton en CameraView:

1. Abrir consola del navegador
2. Buscar `[CameraView] Detector inicializado`
3. Verificar que no haya errores de CORS o permisos de cámara
4. Comprobar que `canvas.width > 0` (tamaño del canvas)

### Si el análisis da score de 0:

1. Verificar que `pose.keypoints.length > 0`
2. Comprobar que los keypoints tienen `score > 0.3`
3. Revisar iluminación y ángulo de la cámara
4. Asegurar que el cuerpo está completamente visible

### Performance Issues:

```typescript
// Reducir FPS del loop (en CameraView)
let lastTime = 0;
const loop = async (timestamp: number) => {
  if (timestamp - lastTime < 100) {
    // Solo cada 100ms (10 FPS)
    loopRef.current = requestAnimationFrame(loop);
    return;
  }
  lastTime = timestamp;
  // ... resto del código
};
```

## 📊 Métricas de Performance

**Inicialización del Modelo:**

- Primera carga: ~2-3 segundos
- Cargas subsecuentes: instantáneo (caché)

**Detección por Frame:**

- Desktop: ~30-60 FPS
- Mobile (high-end): ~20-30 FPS
- Mobile (mid-range): ~10-20 FPS

**Memoria:**

- Modelo en memoria: ~12MB
- Overhead por detección: ~5MB

## 🔐 Seguridad y Privacidad

- ✅ Todas las imágenes se procesan localmente (client-side)
- ✅ No se envían datos a servidores externos
- ✅ El modelo se carga desde CDN de TensorFlow (HTTPS)
- ✅ Las capturas se guardan en localStorage del navegador

## 📚 Referencias

- [PoseNet Documentation](https://github.com/tensorflow/tfjs-models/tree/master/posenet)
- [TensorFlow.js Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [Bodybuilding Pose Guide](https://www.bodybuilding.com/content/the-complete-guide-to-posing.html)
