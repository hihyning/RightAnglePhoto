import { type PoseTemplate } from '../data/poseTemplates';

interface PoseGalleryProps {
  templates: PoseTemplate[];
  onSelectTemplate: (template: PoseTemplate) => void;
  onClose: () => void;
}

export function PoseGallery({ templates, onSelectTemplate, onClose }: PoseGalleryProps) {
  return (
    <div className="pose-gallery-modal" onClick={onClose}>
      <div className="pose-gallery-content" onClick={(e) => e.stopPropagation()}>
        <div className="pose-gallery-header">
          <h2 className="pose-gallery-title">Select Pose Template</h2>
          <button onClick={onClose} className="pose-gallery-close-button">
            ✕
          </button>
        </div>
        <div className="pose-gallery-grid-container">
          <div className="pose-gallery-grid">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="pose-gallery-item"
              >
                <img
                  src={template.imagePath}
                  alt={template.name}
                  className="pose-gallery-image"
                />
                <p className="pose-gallery-name">{template.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

