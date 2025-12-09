import { useEffect, useRef } from 'react';
import { type Landmark, type PoseGuidance, POSE_LANDMARKS } from '../types/pose';
import { type PoseTemplate } from '../data/poseTemplates';

// Helper function to draw text with letter spacing on canvas
function fillTextWithLetterSpacing(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number) {
  const characters = Array.from(text);
  let currentX = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  
  characters.forEach((char, index) => {
    ctx.fillText(char, currentX, y);
    const metrics = ctx.measureText(char);
    currentX += metrics.width + letterSpacing;
  });
}

// Helper function to draw compressed text (for mobile Arial Narrow effect)
function fillTextCompressed(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number, isMobile: boolean = false) {
  if (isMobile) {
    // On mobile, compress text horizontally using scale
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.8, 1); // Compress to 80% width
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    fillTextWithLetterSpacing(ctx, text, 0, 0, letterSpacing);
    ctx.restore();
  } else {
    fillTextWithLetterSpacing(ctx, text, x, y, letterSpacing);
  }
}

// Detect if we're on mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

interface HUDOverlayProps {
  videoElement: HTMLVideoElement | null;
  landmarks: Landmark[] | null;
  guidance: PoseGuidance | null;
  template: PoseTemplate | null;
  viewportWidth: number;
  viewportHeight: number;
  showSkeleton?: boolean;
  templateImageUrl?: string | null;
  templateLandmarks?: Landmark[] | null;
  showTemplateOverlay?: boolean;
  showTemplateSkeleton?: boolean;
}

export function HUDOverlay({
  videoElement,
  landmarks,
  guidance,
  template,
  viewportWidth,
  viewportHeight,
  showSkeleton = false,
  templateImageUrl = null,
  templateLandmarks = null,
  showTemplateOverlay = false,
  showTemplateSkeleton = false,
}: HUDOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateImageRef = useRef<HTMLImageElement | null>(null);

  // Load template image when URL changes
  useEffect(() => {
    if (templateImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        templateImageRef.current = img;
      };
      img.src = templateImageUrl;
    } else {
      templateImageRef.current = null;
    }
  }, [templateImageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return;
    
    // Skip if video isn't ready (prevents crashes on mobile)
    if (videoElement.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw template image overlay first (behind everything else on canvas)
    if (showTemplateOverlay && templateImageRef.current) {
      const img = templateImageRef.current;
      ctx.save();
      ctx.globalAlpha = 0.3; // 30% opacity
      
      // Calculate size to fit within viewport while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const viewportAspect = viewportWidth / viewportHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > viewportAspect) {
        // Image is wider - fit to width
        drawWidth = viewportWidth;
        drawHeight = viewportWidth / imgAspect;
        drawX = 0;
        drawY = (viewportHeight - drawHeight) / 2;
      } else {
        // Image is taller - fit to height
        drawHeight = viewportHeight;
        drawWidth = viewportHeight * imgAspect;
        drawX = (viewportWidth - drawWidth) / 2;
        drawY = 0;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Draw template skeleton on the overlay if enabled
      if (showTemplateSkeleton && templateLandmarks && templateLandmarks.length > 0) {
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
          
          // Torso
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

        // Template landmarks are in normalized coordinates (0-1 relative to image)
        // Scale to match the drawn image size on canvas
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00FFFF';

        connections.forEach(([startIdx, endIdx]) => {
          const start = templateLandmarks[startIdx];
          const end = templateLandmarks[endIdx];

          if (start && end && start.visibility && start.visibility > 0.1 && end.visibility && end.visibility > 0.1) {
            // Landmarks are normalized (0-1), so multiply by draw dimensions
            const startX = drawX + (start.x * drawWidth);
            const startY = drawY + (start.y * drawHeight);
            const endX = drawX + (end.x * drawWidth);
            const endY = drawY + (end.y * drawHeight);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        });
        ctx.shadowBlur = 0;

        // Draw keypoints
        templateLandmarks.forEach((lm, idx) => {
          if (lm && lm.visibility && lm.visibility > 0.1) {
            // Landmarks are normalized (0-1), so multiply by draw dimensions
            const x = drawX + (lm.x * drawWidth);
            const y = drawY + (lm.y * drawHeight);
            
            if (idx <= POSE_LANDMARKS.RIGHT_EAR) {
              ctx.fillStyle = '#FFFF00';
            } else if (idx <= POSE_LANDMARKS.RIGHT_THUMB) {
              ctx.fillStyle = '#00FFFF';
            } else if (idx <= POSE_LANDMARKS.RIGHT_HIP) {
              ctx.fillStyle = '#FF00FF';
            } else {
              ctx.fillStyle = '#00FF00';
            }
            
            ctx.shadowBlur = 8;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
    }

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

    // Draw skeleton wireframe (when toggle is enabled) - independent of guidance
    if (showSkeleton && landmarks && landmarks.length > 0) {
      console.log('Drawing skeleton, landmarks count:', landmarks.length);
      
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

      // Draw wireframe connections with VERY bright, thick lines
      ctx.strokeStyle = '#00FFFF'; // Bright cyan
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#00FFFF';
      
      let connectionsDrawn = 0;
      connections.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        // Lower visibility threshold for skeleton (0.1 instead of 0.3) to show more points
        if (start && end && start.visibility && start.visibility > 0.1 && end.visibility && end.visibility > 0.1) {
          const startX = start.x * canvas.width;
          const startY = start.y * canvas.height;
          const endX = end.x * canvas.width;
          const endY = end.y * canvas.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          connectionsDrawn++;
        }
      });
      ctx.shadowBlur = 0; // Reset shadow
      console.log('Connections drawn:', connectionsDrawn);

      // Draw all keypoints as visible circles
      let keypointsDrawn = 0;
      landmarks.forEach((lm, idx) => {
        // Lower visibility threshold for skeleton
        if (lm && lm.visibility && lm.visibility > 0.1) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          
          // Color code by body part - brighter colors
          if (idx <= POSE_LANDMARKS.RIGHT_EAR) {
            ctx.fillStyle = '#FFFF00'; // Face - bright yellow
          } else if (idx <= POSE_LANDMARKS.RIGHT_THUMB) {
            ctx.fillStyle = '#00FFFF'; // Upper body/arms - bright cyan
          } else if (idx <= POSE_LANDMARKS.RIGHT_HIP) {
            ctx.fillStyle = '#FF00FF'; // Torso - bright magenta
          } else {
            ctx.fillStyle = '#00FF00'; // Lower body - bright green
          }
          
          // Draw larger keypoints with glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = ctx.fillStyle;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // White outline for visibility
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          keypointsDrawn++;
        }
      });
      console.log('Keypoints drawn:', keypointsDrawn);
    }

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
      const isMobile = isMobileDevice();
      ctx.font = isMobile ? '16px Arial, sans-serif' : '16px "Arial Narrow", Arial, sans-serif';
      const hintText = guidance.centerOffset > 0 ? 'Move right' : 'Move left';
      const hintMetrics = ctx.measureText(hintText);
      const hintX = arrowX - (hintMetrics.width * (isMobile ? 0.8 : 1) + (hintText.length - 1) * 0.5) / 2;
      fillTextCompressed(ctx, hintText, hintX, centerY - arrowSize - 10, 0.5, isMobile);
    }

    // Draw distance hint
    if (guidance.distance !== 'good') {
      const hintY = canvas.height - 100;
      ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
      const isMobile = isMobileDevice();
      ctx.font = isMobile ? 'bold 18px Arial, sans-serif' : 'bold 18px "Arial Narrow", Arial, sans-serif';
      const distanceText = guidance.distance === 'too-close' ? 'Step back' : 'Step forward';
      const distanceMetrics = ctx.measureText(distanceText);
      const distanceX = centerX - (distanceMetrics.width * (isMobile ? 0.8 : 1) + (distanceText.length - 1) * 0.5) / 2;
      fillTextCompressed(ctx, distanceText, distanceX, hintY, 0.5, isMobile);
    }

    // Draw tilt indicator
    if (guidance.tilt > 5) {
      const tiltX = canvas.width / 2;
      const tiltY = canvas.height - 60;
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
      const isMobile = isMobileDevice();
      ctx.font = isMobile ? '12px Arial, sans-serif' : '12px "Arial Narrow", Arial, sans-serif';
      const levelText = 'Level';
      const levelMetrics = ctx.measureText(levelText);
      const levelX = tiltX - (levelMetrics.width * (isMobile ? 0.8 : 1) + (levelText.length - 1) * 0.5) / 2;
      fillTextCompressed(ctx, levelText, levelX, tiltY + 30, 0.5, isMobile);
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
      const isMobile = isMobileDevice();
      ctx.font = isMobile ? '12px Arial, sans-serif' : '12px "Arial Narrow", Arial, sans-serif';
      const poseText = `Pose: ${Math.round(matchPercent * 100)}%`;
      fillTextCompressed(ctx, poseText, meterX, meterY - 5, 0.5, isMobile);
    }
  }, [landmarks, guidance, template, videoElement, viewportWidth, viewportHeight, showSkeleton, templateImageUrl, templateLandmarks, showTemplateOverlay, showTemplateSkeleton]);

  return (
    <canvas
      ref={canvasRef}
      className="hud-canvas"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

