import { analyzeFrontDoubleBicep } from '../FrontDoubleBicep'
import type { Keypoint } from '@/services/PoseDetector'

describe('analyzeFrontDoubleBicep', () => {
  const createMockKeypoints = (overrides: Partial<Record<string, Keypoint>> = {}): Keypoint[] => {
    const defaults: Record<string, Keypoint> = {
      left_shoulder: { x: 80, y: 120, score: 0.9, name: 'left_shoulder' },
      right_shoulder: { x: 120, y: 120, score: 0.9, name: 'right_shoulder' },
      left_elbow: { x: 70, y: 140, score: 0.9, name: 'left_elbow' },
      right_elbow: { x: 130, y: 140, score: 0.9, name: 'right_elbow' },
      left_wrist: { x: 65, y: 120, score: 0.9, name: 'left_wrist' },
      right_wrist: { x: 135, y: 120, score: 0.9, name: 'right_wrist' },
      left_hip: { x: 85, y: 180, score: 0.9, name: 'left_hip' },
      right_hip: { x: 115, y: 180, score: 0.9, name: 'right_hip' },
      nose: { x: 100, y: 100, score: 0.9, name: 'nose' },
      left_eye: { x: 95, y: 95, score: 0.9, name: 'left_eye' },
      right_eye: { x: 105, y: 95, score: 0.9, name: 'right_eye' },
      left_ear: { x: 90, y: 100, score: 0.9, name: 'left_ear' },
      right_ear: { x: 110, y: 100, score: 0.9, name: 'right_ear' },
      left_knee: { x: 80, y: 220, score: 0.9, name: 'left_knee' },
      right_knee: { x: 120, y: 220, score: 0.9, name: 'right_knee' },
      left_ankle: { x: 75, y: 260, score: 0.9, name: 'left_ankle' },
      right_ankle: { x: 125, y: 260, score: 0.9, name: 'right_ankle' },
    }

    return Object.values({ ...defaults, ...overrides }).filter(Boolean) as Keypoint[]
  }

  it('should return high score for perfect pose', () => {
    const keypoints = createMockKeypoints()
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    expect(result.score).toBeGreaterThan(70)
    expect(result.feedback).toBeDefined()
    expect(result.feedback.length).toBeGreaterThan(0)
  })

  it('should detect shoulder misalignment', () => {
    const keypoints = createMockKeypoints({
      left_shoulder: { x: 80, y: 100, score: 0.9, name: 'left_shoulder' },
      right_shoulder: { x: 120, y: 140, score: 0.9, name: 'right_shoulder' },
    })
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    const shoulderFeedback = result.feedback.find(f => f.title.includes('Hombros'))
    expect(shoulderFeedback).toBeDefined()
    expect(shoulderFeedback?.status).not.toBe('success')
  })

  it('should detect incorrect elbow angle', () => {
    const keypoints = createMockKeypoints({
      left_elbow: { x: 70, y: 180, score: 0.9, name: 'left_elbow' },
      left_wrist: { x: 65, y: 200, score: 0.9, name: 'left_wrist' },
    })
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    const elbowFeedback = result.feedback.find(f => f.title.includes('Codo'))
    expect(elbowFeedback).toBeDefined()
  })

  it('should detect low visibility', () => {
    const keypoints = createMockKeypoints().map(kp => ({
      ...kp,
      score: 0.3, // Low confidence
    }))
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    const visibilityFeedback = result.feedback.find(f => f.title.includes('Visibilidad'))
    expect(visibilityFeedback).toBeDefined()
    expect(visibilityFeedback?.status).not.toBe('success')
  })

  it('should return feedback array with proper structure', () => {
    const keypoints = createMockKeypoints()
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    result.feedback.forEach(item => {
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('status')
      expect(['success', 'warning', 'error']).toContain(item.status)
    })
  })

  it('should return keypoints in correct format', () => {
    const keypoints = createMockKeypoints()
    
    const result = analyzeFrontDoubleBicep(keypoints)
    
    expect(result.keypoints).toBeDefined()
    expect(Array.isArray(result.keypoints)).toBe(true)
    result.keypoints.forEach(kp => {
      expect(kp).toHaveProperty('part')
      expect(kp).toHaveProperty('position')
      expect(kp.position).toHaveProperty('x')
      expect(kp.position).toHaveProperty('y')
      expect(kp).toHaveProperty('score')
    })
  })
})
