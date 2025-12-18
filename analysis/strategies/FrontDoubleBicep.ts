import type { Keypoint } from '@/services/PoseDetector';
import type { PoseEvaluationResult } from '@/types/analysis';
import {
  getKeypointByName,
  calculateDistance,
  calculateAngle,
  areKeypointsVisible,
  calculateAlignmentRatio,
} from '@/utils/geometry';

export function analyzeFrontDoubleBicep(keypoints: Keypoint[]): PoseEvaluationResult {
  const feedback: PoseEvaluationResult['feedback'] = [];
  let totalScore = 0;
  let criteriaCount = 0;

  // Obtener puntos clave
  const leftShoulder = getKeypointByName(keypoints, 'left_shoulder');
  const rightShoulder = getKeypointByName(keypoints, 'right_shoulder');
  const leftElbow = getKeypointByName(keypoints, 'left_elbow');
  const rightElbow = getKeypointByName(keypoints, 'right_elbow');
  const leftWrist = getKeypointByName(keypoints, 'left_wrist');
  const rightWrist = getKeypointByName(keypoints, 'right_wrist');
  const leftHip = getKeypointByName(keypoints, 'left_hip');
  const rightHip = getKeypointByName(keypoints, 'right_hip');

  // 1. CRITERIO: Alineación de hombros (debe ser horizontal)
  if (areKeypointsVisible([leftShoulder, rightShoulder])) {
    const shoulderDiff = Math.abs(leftShoulder!.y - rightShoulder!.y);
    const shoulderDistance = calculateDistance(leftShoulder!, rightShoulder!);
    const ratio = calculateAlignmentRatio(shoulderDiff, shoulderDistance);

    if (ratio < 0.08) {
      feedback.push({
        title: 'Alineación de Hombros',
        description: '¡Excelente! Tus hombros están perfectamente nivelados.',
        status: 'success',
      });
      totalScore += 95;
    } else if (ratio < 0.15) {
      feedback.push({
        title: 'Alineación de Hombros',
        description: 'Buena alineación, intenta nivelar tus hombros un poco más.',
        status: 'warning',
      });
      totalScore += 75;
    } else {
      feedback.push({
        title: 'Alineación de Hombros',
        description: 'Tus hombros están desnivelados. Mantén ambos a la misma altura.',
        status: 'error',
      });
      totalScore += 50;
    }
    criteriaCount++;
  }

  // 2. CRITERIO: Ángulo de codos (debe estar cerca de 90°)
  if (areKeypointsVisible([leftShoulder, leftElbow, leftWrist])) {
    const leftElbowAngle = calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
    
    if (leftElbowAngle >= 75 && leftElbowAngle <= 105) {
      feedback.push({
        title: 'Ángulo del Codo Izquierdo',
        description: `Perfecto! El ángulo de tu codo es de ${Math.round(leftElbowAngle)}°, ideal para mostrar el bíceps.`,
        status: 'success',
      });
      totalScore += 92;
    } else if (leftElbowAngle >= 60 && leftElbowAngle <= 120) {
      feedback.push({
        title: 'Ángulo del Codo Izquierdo',
        description: `Ángulo de ${Math.round(leftElbowAngle)}°. Intenta flexionar a 90° para máxima definición.`,
        status: 'warning',
      });
      totalScore += 70;
    } else {
      feedback.push({
        title: 'Ángulo del Codo Izquierdo',
        description: `Ángulo de ${Math.round(leftElbowAngle)}° es incorrecto. Flexiona tu brazo a 90°.`,
        status: 'error',
      });
      totalScore += 45;
    }
    criteriaCount++;
  }

  if (areKeypointsVisible([rightShoulder, rightElbow, rightWrist])) {
    const rightElbowAngle = calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
    
    if (rightElbowAngle >= 75 && rightElbowAngle <= 105) {
      feedback.push({
        title: 'Ángulo del Codo Derecho',
        description: `Perfecto! El ángulo es de ${Math.round(rightElbowAngle)}°.`,
        status: 'success',
      });
      totalScore += 92;
    } else if (rightElbowAngle >= 60 && rightElbowAngle <= 120) {
      feedback.push({
        title: 'Ángulo del Codo Derecho',
        description: `Ángulo de ${Math.round(rightElbowAngle)}°. Acércate a 90° para mejor pose.`,
        status: 'warning',
      });
      totalScore += 70;
    } else {
      feedback.push({
        title: 'Ángulo del Codo Derecho',
        description: `Ángulo de ${Math.round(rightElbowAngle)}° necesita ajuste. Busca 90°.`,
        status: 'error',
      });
      totalScore += 45;
    }
    criteriaCount++;
  }

  // 3. CRITERIO: Altura de las muñecas (deben estar a la altura de los hombros)
  if (areKeypointsVisible([leftWrist, rightWrist, leftShoulder, rightShoulder])) {
    const avgShoulderY = (leftShoulder!.y + rightShoulder!.y) / 2;
    const avgWristY = (leftWrist!.y + rightWrist!.y) / 2;
    const wristHeightDiff = Math.abs(avgWristY - avgShoulderY);
    const bodyHeight = leftShoulder && leftHip ? calculateDistance(leftShoulder, leftHip) : 100;
    const relativeHeightDiff = wristHeightDiff / bodyHeight;

    if (relativeHeightDiff < 0.15) {
      feedback.push({
        title: 'Altura de Muñecas',
        description: '¡Excelente! Tus muñecas están a la altura correcta de los hombros.',
        status: 'success',
      });
      totalScore += 88;
    } else if (relativeHeightDiff < 0.3) {
      feedback.push({
        title: 'Altura de Muñecas',
        description: 'Buena posición. Eleva ligeramente las muñecas al nivel de los hombros.',
        status: 'warning',
      });
      totalScore += 65;
    } else {
      feedback.push({
        title: 'Altura de Muñecas',
        description: 'Tus muñecas están muy bajas o altas. Posiciónalas a la altura de los hombros.',
        status: 'error',
      });
      totalScore += 40;
    }
    criteriaCount++;
  }

  // 4. CRITERIO: Visibilidad general del cuerpo
  const visibleKeypoints = keypoints.filter((kp) => (kp.score ?? 0) > 0.5).length;
  const totalKeypoints = keypoints.length;
  const visibilityRatio = visibleKeypoints / totalKeypoints;

  if (visibilityRatio > 0.8) {
    feedback.push({
      title: 'Visibilidad del Cuerpo',
      description: '¡Perfecto! Todas las partes clave están visibles para el análisis.',
      status: 'success',
    });
    totalScore += 85;
  } else if (visibilityRatio > 0.6) {
    feedback.push({
      title: 'Visibilidad del Cuerpo',
      description: 'Buena visibilidad. Asegúrate de tener mejor iluminación y ángulo.',
      status: 'warning',
    });
    totalScore += 60;
  } else {
    feedback.push({
      title: 'Visibilidad del Cuerpo',
      description: 'Dificultad para detectar tu cuerpo. Mejora la iluminación y posición.',
      status: 'error',
    });
    totalScore += 35;
  }
  criteriaCount++;

  // Calcular score promedio
  const finalScore = criteriaCount > 0 ? Math.round(totalScore / criteriaCount) : 0;

  return {
    score: finalScore,
    feedback,
    keypoints: keypoints.map((kp) => ({
      part: kp.name || 'unknown',
      position: { x: kp.x, y: kp.y },
      score: kp.score ?? 0,
    })),
  };
}
