type TfjsModule = typeof import('@tensorflow/tfjs');
type PoseDetectionModule = typeof import('@tensorflow-models/pose-detection');

type PoseDetectorInstance = Awaited<ReturnType<PoseDetectionModule['createDetector']>>;

export type PoseDetectorBackend = 'webgpu' | 'webgl' | 'wasm' | 'cpu';
export type PoseDetectorInitState = 'idle' | 'initializing' | 'ready' | 'error';

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export class PoseDetectorService {
  private static instance: PoseDetectorService | null = null;
  private detector: PoseDetectorInstance | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private initState: PoseDetectorInitState = 'idle';
  private backend: PoseDetectorBackend | null = null;
  private lastInitError: string | null = null;

  private tf: TfjsModule | null = null;
  private poseDetection: PoseDetectionModule | null = null;

  private constructor() {}

  static getInstance(): PoseDetectorService {
    if (!PoseDetectorService.instance) {
      PoseDetectorService.instance = new PoseDetectorService();
    }
    return PoseDetectorService.instance;
  }

  getStatus(): { state: PoseDetectorInitState; backend: PoseDetectorBackend | null; error: string | null } {
    return { state: this.initState, backend: this.backend, error: this.lastInitError };
  }

  private async loadTfjsAndBackends(): Promise<TfjsModule> {
    if (this.tf) return this.tf;

    // TFJS core
    const tf = (await import('@tensorflow/tfjs')) as TfjsModule;

    // Registrar backends (orden no importa). Cada import registra el backend globalmente.
    // En tests, estos módulos se mockean para que no carguen implementaciones nativas.
    try {
      await import('@tensorflow/tfjs-backend-webgpu');
    } catch {}

    try {
      await import('@tensorflow/tfjs-backend-webgl');
    } catch {}

    try {
      const wasm = await import('@tensorflow/tfjs-backend-wasm');
      // Si usamos WASM, definimos paths (CDN) para que encuentre los binarios.
      // Esto evita fallas silenciosas cuando el backend wasm está disponible pero no encuentra .wasm.
      if (typeof (wasm as any).setWasmPaths === 'function') {
        (wasm as any).setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/');
      }
    } catch {}

    this.tf = tf;
    return tf;
  }

  private async selectBestBackend(tf: TfjsModule): Promise<PoseDetectorBackend> {
    const tryBackend = async (backend: PoseDetectorBackend): Promise<boolean> => {
      try {
        if (typeof (tf as any).setBackend === 'function') {
          const ok = await (tf as any).setBackend(backend);
          await tf.ready();
          return Boolean(ok);
        }
        await tf.ready();
        return backend === 'cpu';
      } catch {
        return false;
      }
    };

    // Preferencias: WebGPU (si existe), luego WebGL, luego WASM, luego CPU
    const hasWebGpu = typeof navigator !== 'undefined' && (navigator as any).gpu;

    if (hasWebGpu && (await tryBackend('webgpu'))) return 'webgpu';
    if (await tryBackend('webgl')) return 'webgl';
    if (await tryBackend('wasm')) return 'wasm';
    await tryBackend('cpu');
    return 'cpu';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.initState = 'initializing';
        this.lastInitError = null;

        const tf = await this.loadTfjsAndBackends();
        this.backend = await this.selectBestBackend(tf);

        // MoveNet - Pose Detection API
        this.poseDetection = (await import('@tensorflow-models/pose-detection')) as PoseDetectionModule;

        // Cargar el modelo MoveNet SinglePose Lightning (3x más rápido que PoseNet)
        this.detector = await this.poseDetection.createDetector(
          this.poseDetection.SupportedModels.MoveNet,
          {
            modelType: this.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true, // Suavizado temporal para keypoints más estables
            minPoseScore: 0.3,
          }
        );

        this.isInitialized = true;
        this.initState = 'ready';
        console.log('[PoseDetector] Modelo MoveNet Lightning cargado exitosamente', { backend: this.backend });
      } catch (error) {
        console.error('[PoseDetector] Error al cargar el modelo:', error);
        this.lastInitError = error instanceof Error ? error.message : String(error);
        this.initState = 'error';
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  private normalizeKeypointName(name: string | undefined): string {
    if (!name) return 'unknown';
    // MoveNet ya devuelve nombres en snake_case
    if (name.includes('_')) return name;

    // Fallback: Si por alguna razón viene en camelCase, convertir a snake_case
    // MoveNet usa: left_shoulder, right_shoulder, etc. (ya normalizado)
    const map: Record<string, string> = {
      leftShoulder: 'left_shoulder',
      rightShoulder: 'right_shoulder',
      leftElbow: 'left_elbow',
      rightElbow: 'right_elbow',
      leftWrist: 'left_wrist',
      rightWrist: 'right_wrist',
      leftHip: 'left_hip',
      rightHip: 'right_hip',
      leftKnee: 'left_knee',
      rightKnee: 'right_knee',
      leftAnkle: 'left_ankle',
      rightAnkle: 'right_ankle',
      leftEye: 'left_eye',
      rightEye: 'right_eye',
      leftEar: 'left_ear',
      rightEar: 'right_ear',
      nose: 'nose',
    };

    return map[name] ?? name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  }

  async estimate(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<Pose | null> {
    if (!this.isInitialized || !this.detector) {
      await this.initialize();
    }

    try {
      // MoveNet.estimatePoses() devuelve un array de poses
      const poses = await this.detector!.estimatePoses(input, {
        flipHorizontal: false,
      });

      // Si no hay poses detectadas, retornar null
      if (!poses || poses.length === 0 || !poses[0].keypoints) return null;
      
      const pose = poses[0]; // SinglePose Lightning solo detecta 1 persona
      
      // Normalizar la estructura de keypoints
      // MoveNet devuelve: { x, y, score, name } (ya normalizado)
      const normalizedKeypoints: Keypoint[] = pose.keypoints.map((kp: any) => ({
        x: kp.x,
        y: kp.y,
        score: kp.score,
        name: this.normalizeKeypointName(kp.name),
      }));

      return {
        keypoints: normalizedKeypoints,
        score: pose.score,
      };
    } catch (error) {
      console.error('[PoseDetector] Error durante la estimación:', error);
      return null;
    }
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
      this.initPromise = null;
      this.initState = 'idle';
      this.backend = null;
      this.lastInitError = null;
    }
  }
}
