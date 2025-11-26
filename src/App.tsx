import { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { HUDOverlay } from './components/HUDOverlay';
import { Gallery } from './components/Gallery';
import { usePoseLandmarker } from './hooks/usePoseLandmarker';
import { poseTemplates, type PoseTemplate } from './data/poseTemplates';
import {
  normalizePose,
  computeCenterOffset,
  computeDistanceHint,
  computeTilt,
  computePoseMatch,
} from './utils/poseUtils';
import { type PoseGuidance } from './types/pose';
import { type PhotoRecord, savePhoto, getAllPhotos } from './utils/indexedDB';

type View = 'camera' | 'gallery';

function App() {
  const [view, setView] = useState<View>('camera');
  const [selectedTemplate, setSelectedTemplate] = useState<PoseTemplate>(poseTemplates[0]);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [guidance, setGuidance] = useState<PoseGuidance | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const { latestDetection, hasPerson, isLoading: isPoseLoading } = usePoseLandmarker(
    videoElement,
    view === 'camera'
  );

  // Update viewport size on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    getAllPhotos().then(setPhotos).catch(console.error);
  }, []);

  // Compute guidance from pose detection
  useEffect(() => {
    if (!latestDetection || !videoElement || !selectedTemplate) {
      setGuidance(null);
      return;
    }

    const landmarks = latestDetection.landmarks;
    const normalizedPose = normalizePose(landmarks);
    const templatePose = selectedTemplate.normalizedPose;

    const centerOffset = computeCenterOffset(landmarks, viewportSize.width);
    const distance = computeDistanceHint(landmarks, viewportSize.height);
    const tilt = computeTilt(landmarks);
    const poseMatch = computePoseMatch(normalizedPose, templatePose, selectedTemplate.keyLandmarks);

    setGuidance({
      centerOffset,
      distance,
      tilt,
      poseMatch,
    });
  }, [latestDetection, videoElement, selectedTemplate, viewportSize]);

  const handleCapture = useCallback(async () => {
    if (!videoElement || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      // Flip horizontally to match mirrored video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCapturing(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const photo: PhotoRecord = {
          id: `photo-${Date.now()}`,
          url,
          timestamp: Date.now(),
          meta: {
            poseTemplate: selectedTemplate.id,
            poseMatch: guidance?.poseMatch,
          },
        };

        await savePhoto(photo);
        setPhotos((prev) => [photo, ...prev]);
        
        // Reset capturing state after a short delay
        setTimeout(() => {
          setIsCapturing(false);
        }, 300);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture error:', err);
      alert('Failed to capture photo');
      setIsCapturing(false);
    }
  }, [videoElement, selectedTemplate, guidance, isCapturing]);

  const handlePhotoDelete = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getGuidanceMessage = () => {
    if (!guidance) return null;

    if (guidance.distance === 'too-close') return 'Too close.';
    if (guidance.distance === 'too-far') return 'Step forward.';
    if (Math.abs(guidance.centerOffset) > 0.15) {
      return guidance.centerOffset > 0 ? 'Move right.' : 'Move left.';
    }
    if (guidance.tilt > 5) return 'Still crooked.';
    if (guidance.poseMatch > 0.7) return "Now we're talking.";
    return 'Align with the outline.';
  };

  return (
    <div className="app-container">
      {view === 'camera' ? (
        <>
          {/* Top bar */}
          <div className="top-bar">
            <div className="top-bar-content">
              <h1 className="app-title">rightangle.photo</h1>
              <div className="top-bar-actions">
                <button
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`skeleton-toggle ${showSkeleton ? 'active' : ''}`}
                  title="Toggle skeleton preview"
                >
                  Skeleton
                </button>
                <button
                  onClick={() => setView('gallery')}
                  className="gallery-button"
                >
                  Gallery
                  {photos.length > 0 && (
                    <span className="gallery-badge">{photos.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Camera view */}
          <div className="camera-container">
            <CameraView
              onVideoReady={setVideoElement}
              isActive={view === 'camera'}
            />
            {videoElement && (
              <HUDOverlay
                videoElement={videoElement}
                landmarks={latestDetection?.landmarks || null}
                guidance={guidance}
                template={selectedTemplate}
                viewportWidth={viewportSize.width}
                viewportHeight={viewportSize.height}
                showSkeleton={showSkeleton}
              />
            )}

            {/* Guidance message */}
            {guidance && (
              <div className="guidance-container">
                <div className="guidance-content">
                  <p className="guidance-message">
                    {getGuidanceMessage()}
                  </p>
                </div>
              </div>
            )}

            {/* No person detected message */}
            {!hasPerson && !isPoseLoading && videoElement && (
              <div className="no-person-overlay">
                <div className="no-person-message">
                  <p>Position yourself in frame</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="bottom-controls">
            {/* Pose selector */}
            <div className="pose-selector">
              {poseTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={
                    selectedTemplate.id === template.id
                      ? 'pose-button pose-button-active'
                      : 'pose-button pose-button-inactive'
                  }
                >
                  {template.name}
                </button>
              ))}
            </div>

            {/* Shutter button */}
            <div className="shutter-container">
              <button
                onClick={handleCapture}
                disabled={!hasPerson || isCapturing}
                className={
                  hasPerson && !isCapturing
                    ? 'shutter-button shutter-button-active'
                    : 'shutter-button shutter-button-disabled'
                }
                aria-label="Capture photo"
              />
            </div>

            {/* Screen flash effect */}
            {isCapturing && <div className="screen-flash"></div>}
          </div>
        </>
      ) : (
        <Gallery
          photos={photos}
          onClose={() => setView('camera')}
          onPhotoDelete={handlePhotoDelete}
        />
      )}
    </div>
  );
}

export default App;
