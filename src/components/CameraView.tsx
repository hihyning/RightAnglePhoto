import { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  onVideoReady: (video: HTMLVideoElement) => void;
  isActive: boolean;
}

export function CameraView({ onVideoReady, isActive }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function startCamera() {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get camera with preferred settings
        let mediaStream: MediaStream | null = null;
        
        // First, try back camera (for mobile)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment', // Back camera
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (backCameraError) {
          // If back camera fails, try front camera (for desktop webcam)
          console.log('Back camera not available, trying front camera...');
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'user', // Front camera / webcam
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
          } catch (frontCameraError) {
            // If both fail, try without facingMode constraint (let browser choose)
            console.log('Specific camera failed, trying any available camera...');
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
          }
        }

        if (videoRef.current && mediaStream) {
          console.log('Camera stream obtained:', mediaStream);
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              console.log('Video metadata loaded:', {
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight,
                readyState: videoRef.current.readyState
              });
              videoRef.current.play().then(() => {
                console.log('Video playing successfully');
                setIsLoading(false);
                onVideoReady(videoRef.current!);
              }).catch((playError) => {
                console.error('Video play error:', playError);
                setIsLoading(false);
                setError('Failed to play video stream');
              });
            }
          };

          // Also handle when video starts playing
          videoRef.current.onplaying = () => {
            console.log('Video is now playing');
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to access camera. Please allow camera permissions and make sure a camera is connected.'
        );
        setIsLoading(false);
      }
    }

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onVideoReady]);

  if (error) {
    return (
      <div className="camera-error">
        <div className="camera-error-content">
          <p>Camera Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie-like experience
      />
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Loading camera...</p>
          </div>
        </div>
      )}
      {!isLoading && !error && stream && (
        <div style={{ 
          position: 'absolute', 
          bottom: '10px', 
          left: '10px', 
          background: 'rgba(0,0,0,0.7)', 
          color: '#fff', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          Camera active
        </div>
      )}
    </div>
  );
}

