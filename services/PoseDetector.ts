import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs';

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
  private detector: posenet.PoseNet | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): PoseDetectorService {
    if (!PoseDetectorService.instance) {
      PoseDetectorService.instance = new PoseDetectorService();
    }
    return PoseDetectorService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // Asegurar que TensorFlow está listo
        await tf.ready();

        // Cargar el modelo PoseNet directamente
        this.detector = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 257, height: 257 },
          multiplier: 0.75,
        });

        this.isInitialized = true;
        console.log('[PoseDetector] Modelo PoseNet cargado exitosamente');
      } catch (error) {
        console.error('[PoseDetector] Error al cargar el modelo:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async estimate(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<Pose | null> {
    if (!this.isInitialized || !this.detector) {
      await this.initialize();
    }

    try {
      const pose = await this.detector!.estimateSinglePose(input, {
        flipHorizontal: false,
      });

      if (!pose || !pose.keypoints) return null;
      
      // Normalizar la estructura de keypoints
      const normalizedKeypoints: Keypoint[] = pose.keypoints.map((kp) => ({
        x: kp.position.x,
        y: kp.position.y,
        score: kp.score,
        name: kp.part,
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
    }
  }
}
