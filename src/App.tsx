import { useState, useEffect, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { HUDOverlay } from './components/HUDOverlay';
import { Gallery } from './components/Gallery';
import { PoseGallery } from './components/PoseGallery';
import { usePoseLandmarker } from './hooks/usePoseLandmarker';
import { poseTemplates, type PoseTemplate } from './data/poseTemplates';
import {
  normalizePose,
  computeCenterOffset,
  computeDistanceHint,
  computeTilt,
  computePoseMatch,
  analyzeImagePose,
} from './utils/poseUtils';
import { type PoseGuidance, type Landmark } from './types/pose';
import { type PhotoRecord, savePhoto, getAllPhotos } from './utils/indexedDB';

type View = 'camera' | 'gallery';

// Cache for analyzed template results
const templateAnalysisCache = new Map<string, {
  landmarks: Landmark[];
  normalizedPose: NormalizedPose;
}>();

function App() {
  const [view, setView] = useState<View>('camera');
  const [selectedTemplate, setSelectedTemplate] = useState<PoseTemplate>(poseTemplates[0]);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [guidance, setGuidance] = useState<PoseGuidance | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showPoseGallery, setShowPoseGallery] = useState(false);
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<string | null>(null);
  const [templateLandmarks, setTemplateLandmarks] = useState<Landmark[] | null>(null);
  const [showTemplateSkeleton, setShowTemplateSkeleton] = useState(false);
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState(false);

  const { latestDetection, hasPerson, isLoading: isPoseLoading } = usePoseLandmarker(
    videoElement,
    view === 'camera'
  );

  // Update viewport size on resize (debounced for mobile performance)
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    getAllPhotos().then(setPhotos).catch(console.error);
  }, []);

  // Set initial template image on mount, defer analysis for mobile stability
  useEffect(() => {
    const initialTemplate = poseTemplates[0];
    if (initialTemplate.imagePath) {
      setSelectedTemplateImage(initialTemplate.imagePath);
      
      // Defer analysis to prevent crashes on mobile - wait 2-3 seconds after page load
      const analysisDelay = 2500; // 2.5 seconds
      const timeoutId = setTimeout(() => {
        // Check if result is already cached
        const cached = templateAnalysisCache.get(initialTemplate.id);
        if (cached) {
          const updatedTemplate: PoseTemplate = {
            ...initialTemplate,
            normalizedPose: cached.normalizedPose,
          };
          setSelectedTemplate(updatedTemplate);
          setTemplateLandmarks(cached.landmarks);
          return;
        }

        // Analyze initial template in background
        setIsAnalyzingTemplate(true);
        analyzeImagePose(initialTemplate.imagePath)
          .then((result) => {
            if (result) {
              // Cache the result
              templateAnalysisCache.set(initialTemplate.id, {
                landmarks: result.landmarks,
                normalizedPose: result.normalizedPose,
              });
              
              const updatedTemplate: PoseTemplate = {
                ...initialTemplate,
                normalizedPose: result.normalizedPose,
              };
              setSelectedTemplate(updatedTemplate);
              setTemplateLandmarks(result.landmarks);
            }
          })
          .catch((err) => {
            console.error('Failed to analyze initial template:', err);
          })
          .finally(() => {
            setIsAnalyzingTemplate(false);
          });
      }, analysisDelay);

      return () => clearTimeout(timeoutId);
    }
  }, []); // Only run on mount

  // Handle template selection and analyze image
  const handleTemplateSelect = useCallback(async (template: PoseTemplate) => {
    // Prevent concurrent analyses
    if (isAnalyzingTemplate) {
      return;
    }

    setSelectedTemplate(template);
    setSelectedTemplateImage(template.imagePath);

    // Check cache first
    const cached = templateAnalysisCache.get(template.id);
    if (cached) {
      const updatedTemplate: PoseTemplate = {
        ...template,
        normalizedPose: cached.normalizedPose,
      };
      setSelectedTemplate(updatedTemplate);
      setTemplateLandmarks(cached.landmarks);
      
      // Show skeleton overlay on template for 1 second
      setShowTemplateSkeleton(true);
      setTimeout(() => {
        setShowTemplateSkeleton(false);
      }, 1000);
      return;
    }

    // Analyze the template image with MediaPipe
    setIsAnalyzingTemplate(true);
    try {
      const result = await analyzeImagePose(template.imagePath);
      
      if (result) {
        // Cache the result
        templateAnalysisCache.set(template.id, {
          landmarks: result.landmarks,
          normalizedPose: result.normalizedPose,
        });

        // Update template with analyzed pose
        const updatedTemplate: PoseTemplate = {
          ...template,
          normalizedPose: result.normalizedPose,
        };
        setSelectedTemplate(updatedTemplate);
        setTemplateLandmarks(result.landmarks);

        // Show skeleton overlay on template for 1 second
        setShowTemplateSkeleton(true);
        setTimeout(() => {
          setShowTemplateSkeleton(false);
        }, 1000);
      } else {
        // If analysis fails, use default template
        setTemplateLandmarks(null);
      }
    } catch (err) {
      console.error('Failed to analyze template:', err);
      setTemplateLandmarks(null);
    } finally {
      setIsAnalyzingTemplate(false);
    }
  }, [isAnalyzingTemplate]);

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
              <h1 className="app-title">
                <img src="/RAPL ICON word.png" alt="rightangle.photo" />
              </h1>
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
                templateImageUrl={selectedTemplateImage}
                templateLandmarks={templateLandmarks}
                showTemplateOverlay={showSkeleton}
                showTemplateSkeleton={showTemplateSkeleton}
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
            {/* Pose selector - hidden but kept for reference */}
            <div className="pose-selector">
              {poseTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
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

          {/* Bottom-left pose gallery button */}
          <button
            onClick={() => setShowPoseGallery(true)}
            className="pose-gallery-icon-button"
            aria-label="Open pose gallery"
            title="Select pose template"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4M12 18v4M4 12h4M16 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* Pose Gallery Modal */}
          {showPoseGallery && (
            <PoseGallery
              templates={poseTemplates}
              onSelectTemplate={handleTemplateSelect}
              onClose={() => setShowPoseGallery(false)}
            />
          )}
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
