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
        title: 'Hombros',
        description: '¡Perfecto! Bloquea esa simetría 🔥',
        status: 'success',
      });
      totalScore += 95;
    } else if (ratio < 0.15) {
      // Detectar qué hombro está más bajo para dar feedback específico
      const higherShoulder = leftShoulder!.y < rightShoulder!.y ? 'derecho' : 'izquierdo';
      feedback.push({
        title: 'Hombros',
        description: `Sube un poco el hombro ${higherShoulder} para nivelar ⬆️`,
        status: 'warning',
      });
      totalScore += 75;
    } else {
      const higherShoulder = leftShoulder!.y < rightShoulder!.y ? 'derecho' : 'izquierdo';
      feedback.push({
        title: 'Hombros',
        description: `¡Sube el hombro ${higherShoulder}! Mantén ambos a la misma altura ⚠️`,
        status: 'error',
      });
      totalScore += 50;
    }
    criteriaCount++;
  }

  // 2. CRITERIO: Ángulo de codos (debe estar cerca de 90°)
  // QUICK WIN: Calcular ambos ángulos primero para feedback combinado
  const bothElbowsVisible = areKeypointsVisible([
    leftShoulder, leftElbow, leftWrist,
    rightShoulder, rightElbow, rightWrist
  ]);

  let leftElbowAngle: number | null = null;
  let rightElbowAngle: number | null = null;

  if (areKeypointsVisible([leftShoulder, leftElbow, leftWrist])) {
    leftElbowAngle = calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
  }

  if (areKeypointsVisible([rightShoulder, rightElbow, rightWrist])) {
    rightElbowAngle = calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
  }

  // QUICK WIN 1: Feedback COMBINADO si ambos codos tienen el mismo problema
  if (bothElbowsVisible && leftElbowAngle !== null && rightElbowAngle !== null) {
    const leftPerfect = leftElbowAngle >= 75 && leftElbowAngle <= 105;
    const rightPerfect = rightElbowAngle >= 75 && rightElbowAngle <= 105;
    
    const leftTooClosed = leftElbowAngle < 75;
    const rightTooClosed = rightElbowAngle < 75;
    const leftTooOpen = leftElbowAngle > 105;
    const rightTooOpen = rightElbowAngle > 105;

    // Ambos perfectos
    if (leftPerfect && rightPerfect) {
      feedback.push({
        title: 'Ambos Codos',
        description: '¡Perfectos! Bloquea esos ángulos 🔥🔥',
        status: 'success',
      });
      totalScore += 92;
      criteriaCount++;
      totalScore += 92;
      criteriaCount++;
    }
    // Ambos muy cerrados
    else if (leftTooClosed && rightTooClosed) {
      const avgAngle = Math.round((leftElbowAngle + rightElbowAngle) / 2);
      if (avgAngle < 60) {
        feedback.push({
          title: 'Ambos Codos',
          description: '¡Abre MÁS ambos codos! Aleja los puños de los hombros ⬆️⬆️',
          status: 'error',
        });
        totalScore += 45;
      } else {
        feedback.push({
          title: 'Ambos Codos',
          description: 'Abre más ambos codos - Aleja los puños de los hombros ⬆️⬆️',
          status: 'warning',
        });
        totalScore += 70;
      }
      criteriaCount++;
      totalScore += (avgAngle < 60 ? 45 : 70);
      criteriaCount++;
    }
    // Ambos muy abiertos
    else if (leftTooOpen && rightTooOpen) {
      const avgAngle = Math.round((leftElbowAngle + rightElbowAngle) / 2);
      if (avgAngle > 120) {
        feedback.push({
          title: 'Ambos Codos',
          description: '¡Cierra MÁS ambos codos! Acerca los puños a los hombros ⬇️⬇️',
          status: 'error',
        });
        totalScore += 45;
      } else {
        feedback.push({
          title: 'Ambos Codos',
          description: 'Cierra un poco ambos codos - Acerca los puños a los hombros ⬇️⬇️',
          status: 'warning',
        });
        totalScore += 70;
      }
      criteriaCount++;
      totalScore += (avgAngle > 120 ? 45 : 70);
      criteriaCount++;
    }
    // Feedback individual cuando no coinciden
    else {
      // Codo izquierdo
      if (leftPerfect) {
        feedback.push({
          title: 'Codo Izquierdo',
          description: '¡Perfecto! Bloquea ese ángulo 🔥',
          status: 'success',
        });
        totalScore += 92;
      } else if (leftElbowAngle >= 60 && leftElbowAngle <= 120) {
        if (leftElbowAngle < 75) {
          feedback.push({
            title: 'Codo Izquierdo',
            description: 'Abre más el codo - Aleja el puño del hombro ⬆️',
            status: 'warning',
          });
        } else {
          feedback.push({
            title: 'Codo Izquierdo',
            description: 'Cierra un poco el codo - Acerca el puño al hombro ⬇️',
            status: 'warning',
          });
        }
        totalScore += 70;
      } else {
        if (leftElbowAngle < 60) {
          feedback.push({
            title: 'Codo Izquierdo',
            description: '¡Abre MÁS el codo! Aleja el puño del hombro ⚠️',
            status: 'error',
          });
        } else {
          feedback.push({
            title: 'Codo Izquierdo',
            description: '¡Cierra MÁS el codo! Acerca el puño al hombro ⚠️',
            status: 'error',
          });
        }
        totalScore += 45;
      }
      criteriaCount++;

      // Codo derecho
      if (rightPerfect) {
        feedback.push({
          title: 'Codo Derecho',
          description: '¡Perfecto! Bloquea ese ángulo 🔥',
          status: 'success',
        });
        totalScore += 92;
      } else if (rightElbowAngle >= 60 && rightElbowAngle <= 120) {
        if (rightElbowAngle < 75) {
          feedback.push({
            title: 'Codo Derecho',
            description: 'Abre más el codo - Aleja el puño del hombro ⬆️',
            status: 'warning',
          });
        } else {
          feedback.push({
            title: 'Codo Derecho',
            description: 'Cierra un poco el codo - Acerca el puño al hombro ⬇️',
            status: 'warning',
          });
        }
        totalScore += 70;
      } else {
        if (rightElbowAngle < 60) {
          feedback.push({
            title: 'Codo Derecho',
            description: '¡Abre MÁS el codo! Aleja el puño del hombro ⚠️',
            status: 'error',
          });
        } else {
          feedback.push({
            title: 'Codo Derecho',
            description: '¡Cierra MÁS el codo! Acerca el puño al hombro ⚠️',
            status: 'error',
          });
        }
        totalScore += 45;
      }
      criteriaCount++;
    }
  }
  // Feedback individual si solo uno es visible
  else {
    if (leftElbowAngle !== null) {
      const leftPerfect = leftElbowAngle >= 75 && leftElbowAngle <= 105;
      
      if (leftPerfect) {
        feedback.push({
          title: 'Codo Izquierdo',
          description: '¡Perfecto! Bloquea ese ángulo 🔥',
          status: 'success',
        });
        totalScore += 92;
      } else if (leftElbowAngle >= 60 && leftElbowAngle <= 120) {
        if (leftElbowAngle < 75) {
          feedback.push({
            title: 'Codo Izquierdo',
            description: 'Abre más el codo - Aleja el puño del hombro ⬆️',
            status: 'warning',
          });
        } else {
          feedback.push({
            title: 'Codo Izquierdo',
            description: 'Cierra un poco el codo - Acerca el puño al hombro ⬇️',
            status: 'warning',
          });
        }
        totalScore += 70;
      } else {
        if (leftElbowAngle < 60) {
          feedback.push({
            title: 'Codo Izquierdo',
            description: '¡Abre MÁS el codo! Aleja el puño del hombro ⚠️',
            status: 'error',
          });
        } else {
          feedback.push({
            title: 'Codo Izquierdo',
            description: '¡Cierra MÁS el codo! Acerca el puño al hombro ⚠️',
            status: 'error',
          });
        }
        totalScore += 45;
      }
      criteriaCount++;
    }

    if (rightElbowAngle !== null) {
      const rightPerfect = rightElbowAngle >= 75 && rightElbowAngle <= 105;
      
      if (rightPerfect) {
        feedback.push({
          title: 'Codo Derecho',
          description: '¡Perfecto! Bloquea ese ángulo 🔥',
          status: 'success',
        });
        totalScore += 92;
      } else if (rightElbowAngle >= 60 && rightElbowAngle <= 120) {
        if (rightElbowAngle < 75) {
          feedback.push({
            title: 'Codo Derecho',
            description: 'Abre más el codo - Aleja el puño del hombro ⬆️',
            status: 'warning',
          });
        } else {
          feedback.push({
            title: 'Codo Derecho',
            description: 'Cierra un poco el codo - Acerca el puño al hombro ⬇️',
            status: 'warning',
          });
        }
        totalScore += 70;
      } else {
        if (rightElbowAngle < 60) {
          feedback.push({
            title: 'Codo Derecho',
            description: '¡Abre MÁS el codo! Aleja el puño del hombro ⚠️',
            status: 'error',
          });
        } else {
          feedback.push({
            title: 'Codo Derecho',
            description: '¡Cierra MÁS el codo! Acerca el puño al hombro ⚠️',
            status: 'error',
          });
        }
        totalScore += 45;
      }
      criteriaCount++;
    }
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
        description: '¡Perfecto! Mantén esa altura 🔥',
        status: 'success',
      });
      totalScore += 88;
    } else if (relativeHeightDiff < 0.3) {
      // Feedback DIRECCIONAL: detectar si están muy altas o muy bajas
      if (avgWristY > avgShoulderY) {
        // avgWristY > avgShoulderY significa muñecas ABAJO (Y aumenta hacia abajo en canvas)
        feedback.push({
          title: 'Altura de Muñecas',
          description: 'Sube las muñecas - Llévalas al nivel de los hombros ⬆️',
          status: 'warning',
        });
      } else {
        feedback.push({
          title: 'Altura de Muñecas',
          description: 'Baja las muñecas - Llévalas al nivel de los hombros ⬇️',
          status: 'warning',
        });
      }
      totalScore += 65;
    } else {
      // Error CRÍTICO
      if (avgWristY > avgShoulderY) {
        feedback.push({
          title: 'Altura de Muñecas',
          description: '¡Sube MÁS las muñecas! Deben estar al nivel de los hombros ⚠️',
          status: 'error',
        });
      } else {
        feedback.push({
          title: 'Altura de Muñecas',
          description: '¡Baja MÁS las muñecas! Deben estar al nivel de los hombros ⚠️',
          status: 'error',
        });
      }
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
      title: 'Visibilidad',
      description: '¡Perfecto! Te veo completo 👀',
      status: 'success',
    });
    totalScore += 85;
  } else if (visibilityRatio > 0.6) {
    feedback.push({
      title: 'Visibilidad',
      description: 'Aléjate un poco de la cámara - Necesito verte completo 📸',
      status: 'warning',
    });
    totalScore += 60;
  } else {
    feedback.push({
      title: 'Visibilidad',
      description: '¡No te veo bien! Aléjate más y enciende las luces 💡',
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
