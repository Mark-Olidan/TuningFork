# TuningFork — How to Run the App

Open **4 terminals** in VS Code (click the + button each time).

---

## Terminal 1 — Chords & Sheet Music Server (Docker)

**What it does:** This server handles the Chords and Sheet Music features. It downloads audio from YouTube, analyses it to detect chords, and generates sheet music. It runs inside Docker so you don't need Python installed.

**Before you start:** Make sure Docker Desktop is open and running (look for the whale icon in the system tray at the bottom-right of your screen).

**First time only — build the Docker image (takes 3–5 minutes):**

```
cd C:\TuningForkServer
docker build -t tuningforkserver .
```

Expected output when the build finishes:
```
naming to docker.io/library/tuningforkserver:latest done
```

**Every time — check your LAN IP and update `.env.local`:**

Run this to find your IP:

```
ipconfig
```

Look for **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.45`). Then open `.env.local` and update this line:

```
EXPO_PUBLIC_SHEET_MUSIC_URL=http://<your-ip>:8000
```

> Your LAN IP can change when you reconnect to Wi-Fi — always check before starting the app.

**Every time — start the container:**

```
docker run -p 8000:8000 --name tuningforkserver tuningforkserver
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> Leave this terminal open so you can see the server logs. Chords and Sheet Music requests take 15–40 seconds while the server downloads and processes audio — you will see activity here.

> If you see `Error: container name already in use`, run `docker rm tuningforkserver` first, then retry the `docker run` command.

---

## Terminal 2 — Backend Server

**What it does:** This is the brain of the app. It receives audio from your phone, sends it to ACRCloud (the song recognition service), and returns the song title, artist, album, and artwork back to the app. Without this running, the app cannot identify any songs.

```
node backend/acr-identify-server.mjs
```

Expected output:
```
ACRCloud identify server listening on http://localhost:8787
```

---

## Terminal 3 — Backend Tunnel (localhost.run)

**What it does:** The backend server only runs on your laptop (localhost:8787), which means your phone normally can't reach it — especially on school networks where devices are isolated. This tunnel creates a public URL that forwards requests from your phone on the internet to your laptop's backend server.

```
ssh -R 80:localhost:8787 nokey@localhost.run
```

Type `yes` if asked about the host fingerprint (first time only).

Expected output:
```
https://xxxx.lhr.life tunneled with tls termination
```

Copy that URL and update `.env.local`:
```
EXPO_PUBLIC_API_BASE_URL=https://xxxx.lhr.life
```

> The URL changes every session — always update `.env.local` with the new URL before starting Terminal 4.

---

## Terminal 4 — Expo (Metro Bundler)

**What it does:** This starts the JavaScript bundler that serves your app's code to Expo Go on your phone. The `--tunnel` flag creates a public ngrok URL so your phone can load the app from anywhere, not just your local network.

```
$env:NGROK_PATH="C:\ngrok\ngrok.exe"; npm start -- -c --tunnel
```

Expected output: QR code appears in the terminal.

---

## On Your iPhone

1. Open the **Camera app**
2. Point at the QR code from Terminal 4
3. Tap the **Expo Go** notification that appears

---

## On Your Android Phone

1. Install **Expo Go** from the Google Play Store (if not already installed)
2. Open the **Expo Go** app
3. Tap **Scan QR code** and point at the QR code from Terminal 4

---

## Security

All requests from the app include a secret header (`x-api-secret`) that the backend checks. Any request without the correct secret is rejected with a 401 error. The secret is stored in `.env.local` and `.env.backend.local` — both are excluded from git so they are never committed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Chords / Sheet Music shows an error | Check that Terminal 1 (Docker) is running and you see the Uvicorn line |
| Chords / Sheet Music can't connect | Run `ipconfig`, find your Wi-Fi IPv4 address, and update `EXPO_PUBLIC_SHEET_MUSIC_URL` in `.env.local`, then restart Expo |
| `container name already in use` | Run `docker rm tuningforkserver` then retry `docker run` |
| Docker Desktop not found | Open Docker Desktop from the Start menu and wait for the whale icon to appear in the system tray |
| "Cannot reach the identify server" | Terminal 3 tunnel dropped — re-run the SSH command and update `.env.local` with the new URL, then restart Terminal 4 |
| Port 8787 already in use | Run `netstat -ano \| findstr :8787` then `taskkill /PID <number> /F` |
| Port 8081/8082 already in use | Expo will ask to switch ports — press `y` |
| QR code not loading on phone | Make sure you tapped the Expo Go notification, not just the camera preview |

---

## Reference

- ngrok authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
- localhost.run permanent domain (free): https://localhost.run/docs/forever-free/