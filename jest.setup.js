import '@testing-library/jest-dom'

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn(() => Promise.resolve()),
  setBackend: jest.fn(() => Promise.resolve(true)),
  getBackend: jest.fn(() => 'cpu'),
  browser: {
    fromPixels: jest.fn(),
  },
}))

// Mock TFJS backends (imports used by PoseDetectorService.initialize)
jest.mock('@tensorflow/tfjs-backend-webgl', () => ({}))
jest.mock('@tensorflow/tfjs-backend-webgpu', () => ({}))
jest.mock('@tensorflow/tfjs-backend-wasm', () => ({
  setWasmPaths: jest.fn(),
}))

// Mock MoveNet (Pose Detection API)
jest.mock('@tensorflow-models/pose-detection', () => ({
  SupportedModels: {
    MoveNet: 'MoveNet',
  },
  movenet: {
    modelType: {
      SINGLEPOSE_LIGHTNING: 'SinglePose.Lightning',
    },
  },
  createDetector: jest.fn(() => Promise.resolve({
    estimatePoses: jest.fn(() => Promise.resolve([
      {
        score: 0.9,
        keypoints: [
          { name: 'nose', x: 100, y: 100, score: 0.9 },
          { name: 'left_shoulder', x: 80, y: 120, score: 0.85 },
          { name: 'right_shoulder', x: 120, y: 120, score: 0.85 },
        ],
      }
    ])),
    dispose: jest.fn(),
  })),
}))

// Mock MediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }],
    })),
  },
  writable: true,
})

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
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
}))

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  get: jest.fn(() => 640),
})

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  get: jest.fn(() => 480),
})
