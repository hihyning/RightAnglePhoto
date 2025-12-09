import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { type PoseDetection } from '../types/pose';

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (typeof window !== 'undefined' && window.innerWidth <= 768);

// Reduce FPS on mobile for better performance
const TARGET_FPS = isMobile ? 8 : 12; // 8 FPS on mobile, 12 FPS on desktop
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function usePoseLandmarker(videoElement: HTMLVideoElement | null, isActive: boolean) {
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDetection, setLatestDetection] = useState<PoseDetection | null>(null);
  const [hasPerson, setHasPerson] = useState(false);

  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    let isMounted = true;

    async function initLandmarker() {
      try {
        setIsLoading(true);
        setError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: isMobile ? 'CPU' : 'GPU', // Use CPU on mobile for better stability
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (isMounted) {
          setLandmarker(poseLandmarker);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize pose landmarker:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load pose detection');
          setIsLoading(false);
        }
      }
    }

    initLandmarker();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detection loop
  const detectPose = useCallback(() => {
    if (!landmarker || !videoElement || !isActive) {
      return;
    }

    const now = performance.now();
    if (now - lastFrameTimeRef.current < FRAME_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    lastFrameTimeRef.current = now;

    try {
      if (videoElement.readyState >= 2) {
        // Convert video time to milliseconds
        const videoTime = videoElement.currentTime * 1000;
        const result = landmarker.detectForVideo(videoElement, videoTime);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          }));

          setLatestDetection({
            landmarks,
            timestamp: now,
          });
          setHasPerson(true);
        } else {
          setHasPerson(false);
        }
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  }, [landmarker, videoElement, isActive]);

  // Start/stop detection loop
  useEffect(() => {
    if (isActive && landmarker && videoElement) {
      animationFrameRef.current = requestAnimationFrame(detectPose);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, landmarker, videoElement, detectPose]);

  return {
    landmarker,
    isLoading,
    error,
    latestDetection,
    hasPerson,
  };
}

