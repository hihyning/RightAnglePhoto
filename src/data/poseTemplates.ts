import { type NormalizedPose, POSE_LANDMARKS } from '../types/pose';

export type PoseTemplate = {
  id: string;
  name: string;
  description: string;
  keyLandmarks: number[];
  normalizedPose: NormalizedPose;
}

// Normalized poses (center at hip midpoint, scaled by shoulder-hip distance)
// These are approximate templates - in production, you'd capture these from real poses
export const poseTemplates: PoseTemplate[] = [
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'Standing full body portrait',
    keyLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ],
    normalizedPose: {
      center: { x: 0, y: 0 },
      scale: 1,
      landmarks: [
        // Approximate normalized positions for full body standing pose
        { x: 0, y: -0.4 }, // Left shoulder
        { x: 0, y: -0.4 }, // Right shoulder
        { x: -0.05, y: 0 }, // Left hip
        { x: 0.05, y: 0 }, // Right hip
        { x: -0.05, y: 0.25 }, // Left knee
        { x: 0.05, y: 0.25 }, // Right knee
        { x: -0.05, y: 0.5 }, // Left ankle
        { x: 0.05, y: 0.5 }, // Right ankle
      ],
    },
  },
  {
    id: 'half-body',
    name: 'Half Body',
    description: 'Upper body portrait',
    keyLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
    ],
    normalizedPose: {
      center: { x: 0, y: 0 },
      scale: 1,
      landmarks: [
        { x: -0.1, y: -0.3 }, // Left shoulder
        { x: 0.1, y: -0.3 }, // Right shoulder
        { x: -0.05, y: 0 }, // Left hip
        { x: 0.05, y: 0 }, // Right hip
        { x: -0.15, y: -0.15 }, // Left elbow
        { x: 0.15, y: -0.15 }, // Right elbow
        { x: -0.2, y: 0 }, // Left wrist
        { x: 0.2, y: 0 }, // Right wrist
      ],
    },
  },
  {
    id: 'seated',
    name: 'Seated',
    description: 'Seated portrait',
    keyLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
    ],
    normalizedPose: {
      center: { x: 0, y: 0 },
      scale: 1,
      landmarks: [
        { x: -0.1, y: -0.35 }, // Left shoulder
        { x: 0.1, y: -0.35 }, // Right shoulder
        { x: -0.05, y: 0 }, // Left hip
        { x: 0.05, y: 0 }, // Right hip
        { x: -0.1, y: 0.2 }, // Left knee (bent)
        { x: 0.1, y: 0.2 }, // Right knee (bent)
      ],
    },
  },
];

export const getPoseTemplate = (id: string): PoseTemplate | undefined => {
  return poseTemplates.find((t) => t.id === id);
};

