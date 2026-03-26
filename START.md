# TuningFork — How to Run the App

Open **3 terminals** in VS Code (click the + button each time).

---

## Terminal 1 — Backend Server

**What it does:** This is the brain of the app. It receives audio from your phone, sends it to ACRCloud (the song recognition service), and returns the song title, artist, album, and artwork back to the app. Without this running, the app cannot identify any songs.

```
node backend/acr-identify-server.mjs
```

Expected output:
```
ACRCloud identify server listening on http://localhost:8787
```

---

## Terminal 2 — Backend Tunnel (localhost.run)

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

> The URL changes every session — always update `.env.local` with the new URL before starting Terminal 3.

---

## Terminal 3 — Expo (Metro Bundler)

**What it does:** This starts the JavaScript bundler that serves your app's code to Expo Go on your phone. The `--tunnel` flag creates a public ngrok URL so your phone can load the app from anywhere, not just your local network.

```
$env:NGROK_PATH="C:\ngrok\ngrok.exe"; npm start -- -c --tunnel
```

Expected output: QR code appears in the terminal.

---

## On Your iPhone

1. Open the **Camera app**
2. Point at the QR code from Terminal 3
3. Tap the **Expo Go** notification that appears

---

## Security

All requests from the app include a secret header (`x-api-secret`) that the backend checks. Any request without the correct secret is rejected with a 401 error. The secret is stored in `.env.local` and `.env.backend.local` — both are excluded from git so they are never committed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the identify server" | Terminal 2 tunnel dropped — re-run the SSH command and update `.env.local` with the new URL, then restart Terminal 3 |
| Port 8787 already in use | Run `netstat -ano \| findstr :8787` then `taskkill /PID <number> /F` |
| Port 8081/8082 already in use | Expo will ask to switch ports — press `y` |
| QR code not loading on phone | Make sure you tapped the Expo Go notification, not just the camera preview |

---

## Reference

- ngrok authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
- localhost.run permanent domain (free): https://localhost.run/docs/forever-free/
