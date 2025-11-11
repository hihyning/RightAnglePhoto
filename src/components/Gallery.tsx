import { useState, useEffect } from 'react';
import { type PhotoRecord, getAllPhotos, deletePhoto } from '../utils/indexedDB';

interface GalleryProps {
  photos: PhotoRecord[];
  onClose: () => void;
  onPhotoDelete: (id: string) => void;
}

export function Gallery({ photos, onClose, onPhotoDelete }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);

  const handleDownload = (photo: PhotoRecord) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `rightangle-${photo.timestamp}.jpg`;
    link.click();
  };

  const handleShare = async (photo: PhotoRecord) => {
    try {
      // Convert blob URL to blob
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const file = new File([blob], `rightangle-${photo.timestamp}.jpg`, { type: 'image/jpeg' });

      if (navigator.share) {
        await navigator.share({
          title: 'rightangle.photo',
          files: [file],
        });
      } else {
        // Fallback to download
        handleDownload(photo);
      }
    } catch (err) {
      console.error('Share error:', err);
      handleDownload(photo);
    }
  };

  const handleDelete = async (photo: PhotoRecord) => {
    if (confirm('Delete this photo?')) {
      await deletePhoto(photo.id);
      onPhotoDelete(photo.id);
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    }
  };

  if (selectedPhoto) {
    return (
      <div className="gallery-container">
        <div className="gallery-header">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="gallery-back-button"
          >
            ← Back
          </button>
          <h2 className="gallery-title">rightangle.photo</h2>
          <div className="gallery-spacer"></div>
        </div>
        <div className="gallery-photo-container">
          <img
            src={selectedPhoto.url}
            alt="Captured photo"
            className="gallery-photo"
          />
        </div>
        <div className="gallery-actions">
          <button
            onClick={() => handleDownload(selectedPhoto)}
            className="gallery-action-button gallery-action-download"
          >
            Download
          </button>
          {navigator.share && (
            <button
              onClick={() => handleShare(selectedPhoto)}
              className="gallery-action-button gallery-action-share"
            >
              Share
            </button>
          )}
          <button
            onClick={() => handleDelete(selectedPhoto)}
            className="gallery-action-button gallery-action-delete"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h2 className="gallery-title">Gallery</h2>
        <button onClick={onClose} className="gallery-close-button">
          ✕
        </button>
      </div>
      {photos.length === 0 ? (
        <div className="gallery-empty">
          <p>No photos yet</p>
        </div>
      ) : (
        <div className="gallery-grid-container">
          <div className="gallery-grid">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="gallery-thumbnail-button"
              >
                <img
                  src={photo.url}
                  alt="Thumbnail"
                  className="gallery-thumbnail"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

