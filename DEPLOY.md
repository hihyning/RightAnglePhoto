# Deploying to GitHub Pages

This project is configured to deploy to GitHub Pages automatically.

## Automatic Deployment (Recommended)

1. **Enable GitHub Pages in your repository:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save

2. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy when you push to `main`
   - Check the **Actions** tab to see the deployment progress
   - Once complete, your site will be available at: `https://[your-username].github.io/RightAnglePhoto/`

## Manual Deployment

If you prefer to deploy manually:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Install gh-pages (if not already installed):**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

   Or manually:
   ```bash
   npm run build
   npx gh-pages -d dist
   ```

## Important Notes

- **Base Path**: The app is configured with base path `/RightAnglePhoto/` for GitHub Pages
- If your repository has a different name, update the `base` in `vite.config.ts`
- For a custom domain, set `base: '/'` in `vite.config.ts`

## Testing the Build Locally

Before deploying, test the production build locally:

```bash
npm run build
npm run preview
```

This will serve the built files at `http://localhost:4173` so you can verify everything works.

## Troubleshooting

- **404 errors**: Make sure the base path in `vite.config.ts` matches your repository name
- **Assets not loading**: Check that all paths are relative (Vite handles this automatically)
- **Camera not working**: GitHub Pages requires HTTPS, which it provides. Make sure you're accessing via `https://` not `http://`

