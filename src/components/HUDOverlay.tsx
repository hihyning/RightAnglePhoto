import { useEffect, useRef } from 'react';
import { type Landmark, type PoseGuidance, POSE_LANDMARKS } from '../types/pose';
import { type PoseTemplate } from '../data/poseTemplates';
import { normalizePose, computePoseMatch } from '../utils/poseUtils';

interface HUDOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: Landmark[] | null;
  guidance: PoseGuidance | null;
  template: PoseTemplate | null;
  viewportWidth: number;
  viewportHeight: number;
  showSkeleton?: boolean;
}

export function HUDOverlay({
  videoElement,
  landmarks,
  guidance,
  template,
  viewportWidth,
  viewportHeight,
  showSkeleton = false,
}: HUDOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || !videoElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid/center marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // Center crosshair
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const crosshairSize = 20;

    ctx.beginPath();
    ctx.moveTo(centerX - crosshairSize, centerY);
    ctx.lineTo(centerX + crosshairSize, centerY);
    ctx.moveTo(centerX, centerY - crosshairSize);
    ctx.lineTo(centerX, centerY + crosshairSize);
    ctx.stroke();

    // Rule of thirds grid
    const thirdW = canvas.width / 3;
    const thirdH = canvas.height / 3;

    ctx.beginPath();
    // Vertical lines
    ctx.moveTo(thirdW, 0);
    ctx.lineTo(thirdW, canvas.height);
    ctx.moveTo(thirdW * 2, 0);
    ctx.lineTo(thirdW * 2, canvas.height);
    // Horizontal lines
    ctx.moveTo(0, thirdH);
    ctx.lineTo(canvas.width, thirdH);
    ctx.moveTo(0, thirdH * 2);
    ctx.lineTo(canvas.width, thirdH * 2);
    ctx.stroke();

    if (!guidance) return;

    // Draw center offset arrow
    if (Math.abs(guidance.centerOffset) > 0.1) {
      const arrowX = centerX + (guidance.centerOffset * (canvas.width * 0.3));
      const arrowSize = 30;
      const direction = guidance.centerOffset > 0 ? 1 : -1;

      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.beginPath();
      ctx.moveTo(arrowX, centerY);
      ctx.lineTo(arrowX - direction * arrowSize, centerY - arrowSize / 2);
      ctx.lineTo(arrowX - direction * arrowSize, centerY + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      // Text hint
      ctx.fillStyle = 'white';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        guidance.centerOffset > 0 ? 'Move right' : 'Move left',
        arrowX,
        centerY - arrowSize - 10
      );
    }

    // Draw distance hint
    if (guidance.distance !== 'good') {
      const hintY = canvas.height - 100;
      ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        guidance.distance === 'too-close' ? 'Step back' : 'Step forward',
        centerX,
        hintY
      );
    }

    // Draw tilt indicator
    if (guidance.tilt > 5) {
      const tiltX = canvas.width - 60;
      const tiltY = 60;
      const rotation = guidance.tilt * (Math.PI / 180);

      ctx.save();
      ctx.translate(tiltX, tiltY);
      ctx.rotate(rotation);
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.restore();

      // Level indicator text
      ctx.fillStyle = 'white';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Level', tiltX, tiltY + 30);
    }

    // Draw pose match meter
    if (template && guidance.poseMatch > 0) {
      const meterX = 20;
      const meterY = canvas.height - 80;
      const meterWidth = 200;
      const meterHeight = 20;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

      // Fill
      const matchPercent = guidance.poseMatch;
      ctx.fillStyle = matchPercent > 0.7 ? 'rgba(100, 255, 100, 0.8)' : 'rgba(255, 200, 0, 0.8)';
      ctx.fillRect(meterX, meterY, meterWidth * matchPercent, meterHeight);

      // Border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

      // Text
      ctx.fillStyle = 'white';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`Pose: ${Math.round(matchPercent * 100)}%`, meterX, meterY - 5);
    }

    // Draw skeleton wireframe (when toggle is enabled)
    if (showSkeleton && landmarks) {
      // MediaPipe Pose full body connections (standard skeleton structure)
      const connections = [
        // Face connections
        [POSE_LANDMARKS.LEFT_EYE_INNER, POSE_LANDMARKS.RIGHT_EYE_INNER],
        [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EYE_INNER],
        [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EYE_OUTER],
        [POSE_LANDMARKS.LEFT_EYE_OUTER, POSE_LANDMARKS.LEFT_EAR],
        [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EYE_INNER],
        [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EYE_OUTER],
        [POSE_LANDMARKS.RIGHT_EYE_OUTER, POSE_LANDMARKS.RIGHT_EAR],
        [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.NOSE],
        [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.NOSE],
        [POSE_LANDMARKS.MOUTH_LEFT, POSE_LANDMARKS.MOUTH_RIGHT],
        [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.MOUTH_LEFT],
        [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.MOUTH_RIGHT],
        
        // Torso (shoulders to hips)
        [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
        [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
        [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
        
        // Left arm
        [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
        [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
        [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
        [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
        [POSE_LANDMARKS.LEFT_INDEX, POSE_LANDMARKS.LEFT_THUMB],
        [POSE_LANDMARKS.LEFT_PINKY, POSE_LANDMARKS.LEFT_THUMB],
        
        // Right arm
        [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
        [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
        [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
        [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
        [POSE_LANDMARKS.RIGHT_INDEX, POSE_LANDMARKS.RIGHT_THUMB],
        [POSE_LANDMARKS.RIGHT_PINKY, POSE_LANDMARKS.RIGHT_THUMB],
        
        // Left leg
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
        [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
        [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
        [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
        [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
        
        // Right leg
        [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
        [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
        [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
        [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
        [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
      ];

      // Draw wireframe connections with white/cyan lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      connections.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && start.visibility && start.visibility > 0.3 && end.visibility && end.visibility > 0.3) {
          const startX = start.x * canvas.width;
          const startY = start.y * canvas.height;
          const endX = end.x * canvas.width;
          const endY = end.y * canvas.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });

      // Draw keypoints as small white circles
      landmarks.forEach((lm) => {
        if (lm && lm.visibility && lm.visibility > 0.3) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          
          // Draw keypoint as a small white circle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Optional: subtle outline
          ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }
  }, [landmarks, guidance, template, videoElement, viewportWidth, viewportHeight, showSkeleton]);

  return (
    <canvas
      ref={canvasRef}
      className="hud-canvas"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

