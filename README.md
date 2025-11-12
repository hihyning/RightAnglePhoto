# rightangle.photo

A playful mobile WebAR experience that helps users take better portraits by overlaying live pose + framing guides on top of the camera feed. Uses MediaPipe pose tracking to give simple, real-time guidance (center, distance, tilt, pose match) in a clean HUD-style interface.

## Features

- 📸 Real-time pose detection using MediaPipe
- 🎯 Live guidance overlays (center, distance, tilt, pose matching)
- 📐 Multiple pose templates (Full Body, Half Body, Seated)
- 💾 Local photo gallery with IndexedDB persistence
- 📱 Mobile-first design (iOS Safari + Android Chrome)
- 🎨 Clean, minimal HUD interface

## Tech Stack

- **Framework**: React + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Pose Tracking**: MediaPipe Tasks for Web (@mediapipe/tasks-vision)
- **Storage**: IndexedDB (via custom helper)

## Getting Started

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open the app in your mobile browser (or use Chrome DevTools mobile emulation):
   - The app will request camera permissions
   - Use the back camera for best results

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Select a Pose Template**: Choose from "Full Body", "Half Body", or "Seated" at the bottom
2. **Position Yourself**: Stand in front of the camera and align with the on-screen guides
3. **Follow the HUD Guidance**:
   - Arrows indicate left/right movement needed
   - Distance hints show if you're too close or far
   - Tilt indicator shows if you need to level the camera
   - Pose match meter shows how well you match the template
4. **Capture**: Tap the white shutter button when ready
5. **View Gallery**: Tap "Gallery" in the top right to view and share your photos

## Project Structure

```
src/
├── components/
│   ├── CameraView.tsx      # Camera access and video element
│   ├── HUDOverlay.tsx       # Canvas overlay for guidance visuals
│   └── Gallery.tsx          # Photo gallery view
├── hooks/
│   └── usePoseLandmarker.ts # MediaPipe pose detection hook
├── data/
│   └── poseTemplates.ts     # Pose template definitions
├── utils/
│   ├── poseUtils.ts         # Pose analysis utilities
│   └── indexedDB.ts         # IndexedDB helper for photo storage
├── types/
│   └── pose.ts              # TypeScript type definitions
└── App.tsx                  # Main app component
```

## Performance Notes

- Pose detection is throttled to ~12 FPS for optimal performance
- MediaPipe model loads from CDN on first use
- Photos are stored locally in IndexedDB
- Canvas overlay is optimized for mobile rendering

## Browser Support

- iOS Safari 14+
- Android Chrome 90+
- Requires camera access and WebAssembly support

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Quick Setup

1. **Enable GitHub Pages:**
   - Go to your repository → **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save

2. **Push to main:**
   - Push your code to the `main` branch
   - GitHub Actions will automatically build and deploy
   - Your site will be live at: `https://[your-username].github.io/RightAnglePhoto/`

### Important: Repository Name

If your repository has a **different name** than `RightAnglePhoto`, update the base path in `vite.config.ts`:

```typescript
base: process.env.NODE_ENV === 'production' ? '/YourRepoName/' : '/',
```

### Manual Deployment

```bash
npm run build
npm install -D gh-pages
npm run deploy
```

### Testing Production Build Locally

```bash
npm run build
npm run preview
```

See `DEPLOY.md` for detailed deployment instructions.

## License

MIT
