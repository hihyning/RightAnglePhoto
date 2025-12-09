# Mobile Preview Setup Guide

This guide will help you preview your app on your iPhone using ngrok.

## Prerequisites

✅ ngrok is already installed via Homebrew

## Step 1: Set up ngrok (First Time Only)

1. **Create a free ngrok account:**
   - Go to https://dashboard.ngrok.com/signup
   - Sign up for a free account

2. **Get your authtoken:**
   - After signing up, go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```
   Replace `YOUR_AUTHTOKEN_HERE` with the token you copied.

## Step 2: Start Your Dev Server

In your first terminal window, start the Vite dev server:

```bash
npm run dev
```

Wait until you see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
```

**Keep this terminal running!**

## Step 3: Start ngrok Tunnel

In a **second terminal window**, run:

```bash
./start-ngrok.sh
```

Or manually:
```bash
ngrok http 5173
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:5173
```

## Step 4: Access on Your iPhone

1. **Copy the HTTPS URL** from the ngrok output (the one that looks like `https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app`)

2. **Open Safari on your iPhone** and paste the URL

3. **First time only:** ngrok may show a warning page. Click "Visit Site" to proceed.

4. Your app should now load on your iPhone! 🎉

## Step 5: Live Updates

- **Code changes** on your Mac will automatically reload on your iPhone
- The ngrok URL stays the same as long as the tunnel is running
- If you restart ngrok, you'll get a new URL (free plan limitation)

## Troubleshooting

### ngrok shows "authtoken required"
- Make sure you've run `ngrok config add-authtoken YOUR_TOKEN`

### Can't connect on iPhone
- Make sure both your Mac and iPhone are on the same WiFi network (or use ngrok's paid plan for static domains)
- Check that the dev server is still running
- Verify the ngrok tunnel is active (check the ngrok terminal)

### Port already in use
- If port 5173 is busy, Vite will use the next available port
- Update the ngrok command: `ngrok http 5174` (or whatever port Vite is using)

## Stopping

- Press `Ctrl+C` in the ngrok terminal to stop the tunnel
- Press `Ctrl+C` in the dev server terminal to stop Vite

## Tips

- The ngrok web interface at `http://127.0.0.1:4040` shows all requests and responses (useful for debugging)
- Free ngrok accounts get random URLs that change each time
- For a static URL, consider ngrok's paid plans

