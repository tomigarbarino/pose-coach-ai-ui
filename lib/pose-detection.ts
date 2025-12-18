// AI Pose Detection using TensorFlow.js PoseNet

export interface Keypoint {
  part: string
  position: { x: number; y: number }
  score: number
}

export interface Pose {
  keypoints: Keypoint[]
  score: number
}

export interface PoseAnalysis {
  score: number
  feedback: {
    title: string
    description: string
    status: "success" | "warning" | "error"
  }[]
  keypoints: Keypoint[]
}

let poseNet: any = null
let tf: any = null

// Load TensorFlow.js and PoseNet dynamically
export async function loadPoseNet() {
  if (poseNet) return poseNet

  try {
    // Dynamically import TensorFlow.js and PoseNet
    tf = await import("@tensorflow/tfjs")
    const poseNetModule = await import("@tensorflow-models/posenet")

    // Load PoseNet model
    const net = await poseNetModule.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 257, height: 257 },
      multiplier: 0.75
    })

    poseNet = net
    return net
  } catch (error) {
    console.error("[v0] Error loading PoseNet:", error)
    return null
  }
}

// Analyze pose from image
export async function analyzePoseFromImage(imageElement: HTMLImageElement): Promise<PoseAnalysis> {
  try {
    const net = await loadPoseNet()
    if (!net) {
      throw new Error("Failed to load pose detection model")
    }

    const pose = await net.estimateSinglePose(imageElement, {
      flipHorizontal: false
    })

    if (!pose || pose.score < 0.1) {
      return {
        score: 0,
        feedback: [
          {
            title: "No Pose Detected",
            description: "Could not detect a person in the image. Please ensure you are visible in the frame.",
            status: "error",
          },
        ],
        keypoints: [],
      }
    }

    const analysis = evaluatePose(pose)

    return analysis
  } catch (error) {
    console.error("[v0] Error analyzing pose:", error)
    return {
      score: 0,
      feedback: [
        {
          title: "Analysis Error",
          description: "An error occurred during pose analysis. Please try again.",
          status: "error",
        },
      ],
      keypoints: [],
    }
  }
}

// Evaluate pose quality for bodybuilding
function evaluatePose(pose: any): PoseAnalysis {
  const keypoints = pose.keypoints
  const feedback: PoseAnalysis["feedback"] = []
  let totalScore = 0
  let scoreCount = 0

  // Helper function to get keypoint by name
  const getKeypoint = (name: string) => keypoints.find((kp: any) => kp.name === name)

  // Check shoulder alignment
  const leftShoulder = getKeypoint("left_shoulder")
  const rightShoulder = getKeypoint("right_shoulder")

  if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y)
    const shoulderDistance = Math.abs(leftShoulder.x - rightShoulder.x)
    const shoulderRatio = shoulderDiff / shoulderDistance

    if (shoulderRatio < 0.1) {
      feedback.push({
        title: "Shoulder Alignment",
        description: "Excellent! Your shoulders are level and properly aligned.",
        status: "success",
      })
      totalScore += 95
    } else if (shoulderRatio < 0.2) {
      feedback.push({
        title: "Shoulder Alignment",
        description: "Good shoulder alignment, but try to keep them perfectly level.",
        status: "warning",
      })
      totalScore += 75
    } else {
      feedback.push({
        title: "Shoulder Alignment",
        description: "Your shoulders are uneven. Focus on keeping them at the same height.",
        status: "error",
      })
      totalScore += 50
    }
    scoreCount++
  }

  // Check elbow position
  const leftElbow = getKeypoint("left_elbow")
  const rightElbow = getKeypoint("right_elbow")

  if (leftElbow && rightElbow && leftElbow.score > 0.5 && rightElbow.score > 0.5) {
    const elbowHeight = (leftElbow.y + rightElbow.y) / 2
    const shoulderHeight = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : 0

    if (shoulderHeight && elbowHeight > shoulderHeight) {
      feedback.push({
        title: "Elbow Position",
        description: "Great elbow positioning! Keep them lifted for maximum muscle engagement.",
        status: "success",
      })
      totalScore += 92
    } else {
      feedback.push({
        title: "Elbow Position",
        description: "Try to lift your elbows higher to create better arm separation.",
        status: "warning",
      })
      totalScore += 70
    }
    scoreCount++
  }

  // Check core stability (hips alignment)
  const leftHip = getKeypoint("left_hip")
  const rightHip = getKeypoint("right_hip")

  if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
    const hipDiff = Math.abs(leftHip.y - rightHip.y)
    const hipDistance = Math.abs(leftHip.x - rightHip.x)
    const hipRatio = hipDiff / hipDistance

    if (hipRatio < 0.08) {
      feedback.push({
        title: "Core Stability",
        description: "Excellent core engagement! Your hips are level and stable.",
        status: "success",
      })
      totalScore += 94
    } else {
      feedback.push({
        title: "Core Stability",
        description: "Work on keeping your hips level. Engage your core muscles more.",
        status: "warning",
      })
      totalScore += 72
    }
    scoreCount++
  }

  // Check stance (feet positioning)
  const leftAnkle = getKeypoint("left_ankle")
  const rightAnkle = getKeypoint("right_ankle")

  if (leftAnkle && rightAnkle && leftAnkle.score > 0.5 && rightAnkle.score > 0.5) {
    const stanceWidth = Math.abs(leftAnkle.x - rightAnkle.x)
    const shoulderWidth = leftShoulder && rightShoulder ? Math.abs(leftShoulder.x - rightShoulder.x) : 0

    if (shoulderWidth && stanceWidth > shoulderWidth * 0.8 && stanceWidth < shoulderWidth * 1.5) {
      feedback.push({
        title: "Stance Width",
        description: "Perfect stance! Your feet are positioned at an ideal width.",
        status: "success",
      })
      totalScore += 90
    } else {
      feedback.push({
        title: "Stance Width",
        description: "Adjust your stance to be shoulder-width apart for better balance.",
        status: "warning",
      })
      totalScore += 68
    }
    scoreCount++
  }

  // Check overall visibility
  const visibleKeypoints = keypoints.filter((kp: any) => kp.score > 0.5).length
  const totalKeypoints = keypoints.length

  if (visibleKeypoints / totalKeypoints > 0.8) {
    feedback.push({
      title: "Body Visibility",
      description: "Excellent! All key body parts are clearly visible for accurate analysis.",
      status: "success",
    })
    totalScore += 88
    scoreCount++
  } else if (visibleKeypoints / totalKeypoints > 0.6) {
    feedback.push({
      title: "Body Visibility",
      description: "Most body parts are visible, but ensure better lighting and camera angle.",
      status: "warning",
    })
    totalScore += 65
    scoreCount++
  }

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

  return {
    score: averageScore,
    feedback,
    keypoints: keypoints.map((kp: any) => ({
      part: kp.name,
      position: { x: kp.x, y: kp.y },
      score: kp.score,
    })),
  }
}

// Draw pose keypoints on canvas from video in real-time
export async function detectPoseFromVideo(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
): Promise<void> {
  const net = await loadPoseNet()
  if (!net) return

  const ctx = canvasElement.getContext("2d")
  if (!ctx) return

  // Set canvas size to match video
  canvasElement.width = videoElement.videoWidth
  canvasElement.height = videoElement.videoHeight

  async function detectFrame() {
    if (videoElement.readyState < 2) {
      requestAnimationFrame(detectFrame)
      return
    }

    try {
      const pose = await net.estimateSinglePose(videoElement, {
        flipHorizontal: false
      })

      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
      
      // Draw video frame
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

      if (pose && pose.score > 0.1) {
        // Draw keypoints
        pose.keypoints.forEach((keypoint: any) => {
          if (keypoint.score > 0.5 && ctx) {
            ctx.beginPath()
            ctx.arc(keypoint.position.x, keypoint.position.y, 8, 0, 2 * Math.PI)
            ctx.fillStyle = "rgb(132, 250, 176)"
            ctx.fill()
            ctx.strokeStyle = "rgb(20, 40, 30)"
            ctx.lineWidth = 2
            ctx.stroke()
          }
        })

        // Draw skeleton connections
        const connections = [
          ["leftShoulder", "rightShoulder"],
          ["leftShoulder", "leftElbow"],
          ["leftElbow", "leftWrist"],
          ["rightShoulder", "rightElbow"],
          ["rightElbow", "rightWrist"],
          ["leftShoulder", "leftHip"],
          ["rightShoulder", "rightHip"],
          ["leftHip", "rightHip"],
          ["leftHip", "leftKnee"],
          ["leftKnee", "leftAnkle"],
          ["rightHip", "rightKnee"],
          ["rightKnee", "rightAnkle"],
        ]

        connections.forEach(([start, end]) => {
          const startPoint = pose.keypoints.find((kp: any) => kp.part === start)
          const endPoint = pose.keypoints.find((kp: any) => kp.part === end)

          if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5 && ctx) {
            ctx.beginPath()
            ctx.moveTo(startPoint.position.x, startPoint.position.y)
            ctx.lineTo(endPoint.position.x, endPoint.position.y)
            ctx.strokeStyle = "rgb(132, 250, 176)"
            ctx.lineWidth = 3
            ctx.stroke()
          }
        })
      }
    } catch (error) {
      console.error("Error detecting pose:", error)
    }

    requestAnimationFrame(detectFrame)
  }

  detectFrame()
}

// Draw pose keypoints on canvas
export function drawPoseOnCanvas(
  canvas: HTMLCanvasElement,
  imageElement: HTMLImageElement,
  keypoints: Keypoint[],
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = imageElement.width
  canvas.height = imageElement.height

  ctx.drawImage(imageElement, 0, 0)

  // Draw keypoints
  keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.5) {
      ctx.beginPath()
      ctx.arc(keypoint.position.x, keypoint.position.y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = "rgb(132, 250, 176)"
      ctx.fill()
      ctx.strokeStyle = "rgb(20, 40, 30)"
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })

  // Draw skeleton connections
  const connections = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ]

  connections.forEach(([start, end]) => {
    const startPoint = keypoints.find((kp) => kp.part === start)
    const endPoint = keypoints.find((kp) => kp.part === end)

    if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5) {
      ctx.beginPath()
      ctx.moveTo(startPoint.position.x, startPoint.position.y)
      ctx.lineTo(endPoint.position.x, endPoint.position.y)
      ctx.strokeStyle = "rgb(132, 250, 176)"
      ctx.lineWidth = 3
      ctx.stroke()
    }
  })
}
