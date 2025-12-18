import { drawKeypoints, clearCanvas } from '../canvasDrawing'
import type { Keypoint } from '@/services/PoseDetector'

describe('canvasDrawing utilities', () => {
  let canvas: HTMLCanvasElement
  let mockCtx: jest.Mocked<CanvasRenderingContext2D>

  beforeEach(() => {
    canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    
    // Create a mock context that will be returned by getContext
    mockCtx = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as any
    
    // Mock getContext to always return our mockCtx
    jest.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as any)
  })

  describe('clearCanvas', () => {
    it('should clear the canvas', () => {
      clearCanvas(canvas)
      
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 640, 480)
    })
  })

  describe('drawKeypoints', () => {
    it('should draw keypoints and connections', () => {
      const keypoints: Keypoint[] = [
        { x: 100, y: 100, score: 0.9, name: 'nose' },
        { x: 80, y: 120, score: 0.85, name: 'left_shoulder' },
        { x: 120, y: 120, score: 0.85, name: 'right_shoulder' },
      ]

      drawKeypoints(mockCtx, keypoints, 0.3)

      // Should draw at least one keypoint
      expect(mockCtx.arc).toHaveBeenCalled()
      expect(mockCtx.stroke).toHaveBeenCalled()
    })

    it('should not draw keypoints below threshold', () => {
      const keypoints: Keypoint[] = [
        { x: 100, y: 100, score: 0.2, name: 'nose' },
      ]

      drawKeypoints(mockCtx, keypoints, 0.5)

      // Should not draw keypoint with score 0.2 when threshold is 0.5
      expect(mockCtx.arc).not.toHaveBeenCalled()
    })
  })
})
