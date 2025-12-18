import { initializeStorage, addScan, getScans, clearScans } from '../storage'

describe('storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('initializeStorage', () => {
    it('should initialize storage with empty array', () => {
      initializeStorage()
      
      const scans = getScans()
      expect(scans).toEqual([])
    })

    it('should not overwrite existing data', () => {
      const existingData = [
        {
          id: '1',
          pose: 'frontDoubleBiceps',
          score: 85,
          date: new Date().toISOString(),
          thumbnail: 'data:image/jpeg;base64,test',
          feedback: [],
        },
      ]
      
      localStorage.setItem('posecoach_scans', JSON.stringify(existingData))
      
      initializeStorage()
      
      const scans = getScans()
      expect(scans).toEqual(existingData)
    })
  })

  describe('addScan', () => {
    it('should add a scan to storage', () => {
      const scan = {
        id: '1',
        pose: 'frontDoubleBiceps' as const,
        score: 85,
        date: new Date().toISOString(),
        thumbnail: 'data:image/jpeg;base64,test',
        feedback: [
          {
            title: 'Test Feedback',
            description: 'Test description',
            status: 'success' as const,
          },
        ],
      }
      
      addScan(scan)
      
      const scans = getScans()
      expect(scans).toHaveLength(1)
      expect(scans[0]).toEqual(scan)
    })

    it('should add multiple scans', () => {
      const scan1 = {
        id: '1',
        pose: 'frontDoubleBiceps' as const,
        score: 85,
        date: new Date().toISOString(),
        thumbnail: 'data:image/jpeg;base64,test1',
        feedback: [],
      }
      
      const scan2 = {
        id: '2',
        pose: 'latSpread' as const,
        score: 90,
        date: new Date().toISOString(),
        thumbnail: 'data:image/jpeg;base64,test2',
        feedback: [],
      }
      
      addScan(scan1)
      addScan(scan2)
      
      const scans = getScans()
      expect(scans).toHaveLength(2)
    })
  })

  describe('getScans', () => {
    it('should return empty array when no scans', () => {
      const scans = getScans()
      expect(scans).toEqual([])
    })

    it('should return all scans', () => {
      const scan = {
        id: '1',
        pose: 'frontDoubleBiceps' as const,
        score: 85,
        date: new Date().toISOString(),
        thumbnail: 'data:image/jpeg;base64,test',
        feedback: [],
      }
      
      addScan(scan)
      
      const scans = getScans()
      expect(scans).toHaveLength(1)
      expect(scans[0]).toEqual(scan)
    })
  })

  describe('clearScans', () => {
    it('should clear all scans', () => {
      const scan = {
        id: '1',
        pose: 'frontDoubleBiceps' as const,
        score: 85,
        date: new Date().toISOString(),
        thumbnail: 'data:image/jpeg;base64,test',
        feedback: [],
      }
      
      addScan(scan)
      expect(getScans()).toHaveLength(1)
      
      clearScans()
      expect(getScans()).toEqual([])
    })
  })
})
