import { PoseDetectorService } from '../PoseDetector'
import * as poseDetection from '@tensorflow-models/pose-detection'

jest.mock('@tensorflow-models/pose-detection')

describe('PoseDetectorService', () => {
  let service: PoseDetectorService

  beforeEach(() => {
    jest.clearAllMocks()
    service = PoseDetectorService.getInstance()
  })

  afterEach(() => {
    service.dispose()
  })

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PoseDetectorService.getInstance()
      const instance2 = PoseDetectorService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('initialize', () => {
    it('should load MoveNet model', async () => {
      await service.initialize()
      
      expect(poseDetection.createDetector).toHaveBeenCalledWith(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.3,
        }
      )
    })

    it('should not load model twice', async () => {
      await service.initialize()
      await service.initialize()
      
      // Should only be called once
      expect(poseDetection.createDetector).toHaveBeenCalledTimes(1)
    })
  })

  describe('estimate', () => {
    it('should estimate pose from video element', async () => {
      const video = document.createElement('video')
      
      const pose = await service.estimate(video)
      
      expect(pose).toBeDefined()
      expect(pose?.keypoints).toHaveLength(3)
      expect(pose?.score).toBe(0.9)
    })

    it('should normalize keypoints structure', async () => {
      const video = document.createElement('video')
      
      const pose = await service.estimate(video)
      
      expect(pose?.keypoints[0]).toHaveProperty('x')
      expect(pose?.keypoints[0]).toHaveProperty('y')
      expect(pose?.keypoints[0]).toHaveProperty('score')
      expect(pose?.keypoints[0]).toHaveProperty('name')
    })

    it('should handle estimation errors', async () => {
      const mockError = new Error('Estimation failed')
      ;(poseDetection.createDetector as jest.Mock).mockResolvedValueOnce({
        estimatePoses: jest.fn(() => Promise.reject(mockError)),
        dispose: jest.fn(),
      })

      const video = document.createElement('video')
      
      const pose = await service.estimate(video)
      
      expect(pose).toBeNull()
    })
  })

  describe('dispose', () => {
    it('should dispose detector and reset state', async () => {
      await service.initialize()
      const mockDispose = jest.fn()
      
      // Replace the mock dispose function
      ;(service as any).detector = { dispose: mockDispose }
      
      service.dispose()
      
      expect(mockDispose).toHaveBeenCalled()
    })
  })
})
