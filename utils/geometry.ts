import type { Keypoint } from '@/services/PoseDetector';

export function getKeypointByName(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find((kp) => kp.name === name);
}

export function calculateDistance(p1: Keypoint, p2: Keypoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

export function calculateMidpoint(p1: Keypoint, p2: Keypoint): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function isKeypointVisible(keypoint: Keypoint | undefined, minScore = 0.5): boolean {
  return keypoint !== undefined && (keypoint.score ?? 0) >= minScore;
}

export function areKeypointsVisible(
  keypoints: (Keypoint | undefined)[],
  minScore = 0.5
): boolean {
  return keypoints.every((kp) => isKeypointVisible(kp, minScore));
}

export function calculateVerticalAlignment(p1: Keypoint, p2: Keypoint): number {
  return Math.abs(p1.y - p2.y);
}

export function calculateHorizontalAlignment(p1: Keypoint, p2: Keypoint): number {
  return Math.abs(p1.x - p2.x);
}

// Calcular ratio de alineación (0 = perfecto, mayor = peor)
export function calculateAlignmentRatio(
  verticalDiff: number,
  horizontalDistance: number
): number {
  if (horizontalDistance === 0) return 1;
  return verticalDiff / horizontalDistance;
}
