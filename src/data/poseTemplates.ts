import { type NormalizedPose, POSE_LANDMARKS } from '../types/pose';

export type PoseTemplate = {
  id: string;
  name: string;
  description: string;
  keyLandmarks: number[];
  normalizedPose: NormalizedPose;
  imagePath: string;
}

// Normalized poses (center at hip midpoint, scaled by shoulder-hip distance)
// These are approximate templates - in production, you'd capture these from real poses
export const poseTemplates: PoseTemplate[] = [
  {
    id: 'standing-fullbody1',
    name: 'Standing Full Body 1',
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
    imagePath: '/poses/RAPL Pose-standingfullbody1.jpg',
  },
  {
    id: 'standing-fullbody2',
    name: 'Standing Full Body 2',
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
    imagePath: '/poses/RAPL Pose-standingfullbody2.jpg',
  },
  {
    id: 'standing-34body1',
    name: 'Standing 3/4 Body 1',
    description: 'Standing three-quarter body portrait',
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
    imagePath: '/poses/RAPL Pose-standing34body1.jpg',
  },
  {
    id: 'standing-34body2',
    name: 'Standing 3/4 Body 2',
    description: 'Standing three-quarter body portrait',
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
    imagePath: '/poses/RAPL Pose-standing34body2.jpg',
  },
  {
    id: 'sitting-floor1',
    name: 'Sitting Floor 1',
    description: 'Seated floor portrait',
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
    imagePath: '/poses/RAPL Pose-sittingfloor1.jpg',
  },
  {
    id: 'sitting-floor2',
    name: 'Sitting Floor 2',
    description: 'Seated floor portrait',
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
    imagePath: '/poses/RAPL Pose-sittingfloor2.jpg',
  },
];

export const getPoseTemplate = (id: string): PoseTemplate | undefined => {
  return poseTemplates.find((t) => t.id === id);
};

