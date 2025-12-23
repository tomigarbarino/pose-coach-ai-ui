import type { Keypoint } from '@/services/PoseDetector';

// Conexiones estándar del esqueleto para PoseNet/MoveNet
const POSE_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
];

export function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  minScore = 0.3
): void {
  // Estilo Gimnasio: Amarillo Neón (Alto Contraste para luces LED fuertes)
  const pointColor = 'rgb(255, 215, 0)'; // Amarillo dorado neón
  const pointStroke = 'rgb(40, 35, 0)'; // Sombra oscura
  const lineColor = 'rgb(255, 215, 0)'; // Amarillo dorado neón
  
  // 1. Dibujar conexiones (líneas) primero para que queden debajo
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 4; // Más grosor para mejor visibilidad
  ctx.shadowBlur = 10; // Glow effect para gimnasio
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';

  POSE_CONNECTIONS.forEach(([startName, endName]) => {
    const startPoint = keypoints.find((kp) => kp.name === startName);
    const endPoint = keypoints.find((kp) => kp.name === endName);

    if (
      startPoint &&
      endPoint &&
      (startPoint.score ?? 0) > minScore &&
      (endPoint.score ?? 0) > minScore
    ) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }
  });

  // 2. Dibujar puntos (keypoints) encima
  keypoints.forEach((kp) => {
    if ((kp.score ?? 0) > minScore) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI); // Más grande para mejor visibilidad
      ctx.fillStyle = pointColor;
      ctx.shadowBlur = 15; // Glow intenso
      ctx.shadowColor = 'rgba(255, 215, 0, 1)';
      ctx.fill();
      ctx.strokeStyle = pointStroke;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0; // Reset shadow para el stroke
      ctx.stroke();
    }
  });
  
  // Reset shadow para otros dibujos
  ctx.shadowBlur = 0;
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function drawImageOnCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | HTMLVideoElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
  canvas.height = image instanceof HTMLVideoElement ? image.videoHeight : image.height;
  
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}
