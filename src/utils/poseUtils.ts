import { type Landmark, type NormalizedPose, type PoseGuidance, POSE_LANDMARKS } from '../types/pose';

/**
 * Normalize pose landmarks to center at hip midpoint and scale by body height
 */
export function normalizePose(landmarks: Landmark[]): NormalizedPose {
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  // Compute center (hip midpoint)
  const center = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Compute scale (distance from hips to shoulders)
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const shoulderHipDistance = Math.sqrt(
    Math.pow(shoulderMidpoint.x - center.x, 2) + Math.pow(shoulderMidpoint.y - center.y, 2)
  );

  // Use body height as scale (from top of head to bottom of feet)
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const ankleMidpoint = {
    x: (leftAnkle.x + rightAnkle.x) / 2,
    y: (leftAnkle.y + rightAnkle.y) / 2,
  };
  const bodyHeight = Math.sqrt(
    Math.pow(nose.x - ankleMidpoint.x, 2) + Math.pow(nose.y - ankleMidpoint.y, 2)
  );

  const scale = bodyHeight || shoulderHipDistance || 1;

  // Normalize landmarks
  const normalizedLandmarks = landmarks.map((lm) => ({
    x: (lm.x - center.x) / scale,
    y: (lm.y - center.y) / scale,
    z: lm.z ? lm.z / scale : undefined,
    visibility: lm.visibility,
  }));

  return {
    landmarks: normalizedLandmarks,
    center: { x: 0, y: 0 },
    scale: 1,
  };
}

/**
 * Compute center offset (-1 = left, 0 = center, 1 = right)
 */
export function computeCenterOffset(landmarks: Landmark[], viewportWidth: number): number {
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const centerX = ((leftHip.x + rightHip.x) / 2) * viewportWidth;
  const viewportCenter = viewportWidth / 2;
  const offset = (centerX - viewportCenter) / (viewportWidth / 2);
  return Math.max(-1, Math.min(1, offset));
}

/**
 * Compute distance hint based on bounding box height
 */
export function computeDistanceHint(landmarks: Landmark[], viewportHeight: number): 'too-close' | 'good' | 'too-far' {
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const ankleMidpoint = {
    x: (leftAnkle.x + rightAnkle.x) / 2,
    y: (leftAnkle.y + rightAnkle.y) / 2,
  };

  const bodyHeight = Math.sqrt(
    Math.pow(nose.x - ankleMidpoint.x, 2) + Math.pow(nose.y - ankleMidpoint.y, 2)
  ) * viewportHeight;

  // Thresholds (adjust based on testing)
  const minHeight = viewportHeight * 0.4; // Too close if body takes > 60% of height
  const maxHeight = viewportHeight * 0.15; // Too far if body takes < 15% of height

  if (bodyHeight > minHeight) return 'too-close';
  if (bodyHeight < maxHeight) return 'too-far';
  return 'good';
}

/**
 * Compute tilt angle from shoulders (degrees)
 */
export function computeTilt(landmarks: Landmark[]): number {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Return absolute tilt (0 = level, 90 = vertical)
  return Math.abs(angle);
}

/**
 * Compute pose match percentage between normalized pose and template
 */
export function computePoseMatch(
  normalizedPose: NormalizedPose,
  templatePose: NormalizedPose,
  keyLandmarkIndices: number[]
): number {
  if (keyLandmarkIndices.length === 0) return 0;

  let totalError = 0;
  let validLandmarks = 0;

  for (const idx of keyLandmarkIndices) {
    const live = normalizedPose.landmarks[idx];
    const template = templatePose.landmarks[idx];

    if (live && template && live.visibility && live.visibility > 0.5) {
      const dx = live.x - template.x;
      const dy = live.y - template.y;
      totalError += Math.sqrt(dx * dx + dy * dy);
      validLandmarks++;
    }
  }

  if (validLandmarks === 0) return 0;

  const avgError = totalError / validLandmarks;
  // Convert error to match percentage (0-1)
  // Lower error = higher match
  // Threshold: error < 0.1 = 100%, error > 0.5 = 0%
  const match = Math.max(0, Math.min(1, 1 - (avgError / 0.5)));
  return match;
}

/**
 * Get bounding box of pose landmarks
 */
export function getPoseBoundingBox(landmarks: Landmark[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  const visibleLandmarks = landmarks.filter((lm) => lm.visibility && lm.visibility > 0.3);
  if (visibleLandmarks.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  const xs = visibleLandmarks.map((lm) => lm.x);
  const ys = visibleLandmarks.map((lm) => lm.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

