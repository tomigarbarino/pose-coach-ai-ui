import {
  calculateDistance,
  calculateAngle,
  calculateMidpoint,
  isKeypointVisible,
  areKeypointsVisible,
  calculateAlignmentRatio,
} from '../geometry'
import type { Keypoint } from '@/services/PoseDetector'

describe('geometry utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const p1: Keypoint = { x: 0, y: 0, score: 1 }
      const p2: Keypoint = { x: 3, y: 4, score: 1 }
      
      expect(calculateDistance(p1, p2)).toBe(5)
    })

    it('should handle same point', () => {
      const p1: Keypoint = { x: 10, y: 10, score: 1 }
      const p2: Keypoint = { x: 10, y: 10, score: 1 }
      
      expect(calculateDistance(p1, p2)).toBe(0)
    })
  })

  describe('calculateAngle', () => {
    it('should calculate 90 degree angle', () => {
      const p1: Keypoint = { x: 0, y: 0, score: 1 }
      const p2: Keypoint = { x: 1, y: 0, score: 1 }
      const p3: Keypoint = { x: 1, y: 1, score: 1 }
      
      const angle = calculateAngle(p1, p2, p3)
      expect(angle).toBeCloseTo(90, 1)
    })

    it('should calculate 180 degree angle', () => {
      const p1: Keypoint = { x: 0, y: 0, score: 1 }
      const p2: Keypoint = { x: 1, y: 0, score: 1 }
      const p3: Keypoint = { x: 2, y: 0, score: 1 }
      
      const angle = calculateAngle(p1, p2, p3)
      expect(angle).toBeCloseTo(180, 1)
    })
  })

  describe('calculateMidpoint', () => {
    it('should calculate midpoint between two points', () => {
      const p1: Keypoint = { x: 0, y: 0, score: 1 }
      const p2: Keypoint = { x: 10, y: 10, score: 1 }
      
      const midpoint = calculateMidpoint(p1, p2)
      expect(midpoint).toEqual({ x: 5, y: 5 })
    })
  })

  describe('isKeypointVisible', () => {
    it('should return true for visible keypoint', () => {
      const kp: Keypoint = { x: 100, y: 100, score: 0.8 }
      expect(isKeypointVisible(kp, 0.5)).toBe(true)
    })

    it('should return false for low confidence keypoint', () => {
      const kp: Keypoint = { x: 100, y: 100, score: 0.3 }
      expect(isKeypointVisible(kp, 0.5)).toBe(false)
    })

    it('should return false for undefined keypoint', () => {
      expect(isKeypointVisible(undefined, 0.5)).toBe(false)
    })
  })

  describe('areKeypointsVisible', () => {
    it('should return true when all keypoints are visible', () => {
      const keypoints: Keypoint[] = [
        { x: 100, y: 100, score: 0.8 },
        { x: 110, y: 110, score: 0.9 },
      ]
      
      expect(areKeypointsVisible(keypoints, 0.5)).toBe(true)
    })

    it('should return false when any keypoint is not visible', () => {
      const keypoints: (Keypoint | undefined)[] = [
        { x: 100, y: 100, score: 0.8 },
        undefined,
      ]
      
      expect(areKeypointsVisible(keypoints, 0.5)).toBe(false)
    })
  })

  describe('calculateAlignmentRatio', () => {
    it('should calculate alignment ratio', () => {
      const verticalDiff = 5
      const horizontalDistance = 100
      
      expect(calculateAlignmentRatio(verticalDiff, horizontalDistance)).toBe(0.05)
    })

    it('should return 1 for zero horizontal distance', () => {
      expect(calculateAlignmentRatio(5, 0)).toBe(1)
    })
  })
})
