# TuningFork — How to Run the App

Open **3 terminals** in VS Code (click the + button each time).

---

## Terminal 1 — Backend Server
```
node backend/acr-identify-server.mjs
```
Expected output: `ACRCloud identify server listening on http://localhost:8787`

---

## Terminal 2 — Backend Tunnel (localhost.run)
```
ssh -R 80:localhost:8787 nokey@localhost.run
```
Type `yes` if asked about the host fingerprint.

Expected output: a URL like `https://xxxx.lhr.life`

Copy that URL and update `.env.local`:
```
EXPO_PUBLIC_API_BASE_URL=https://xxxx.lhr.life
```

---

## Terminal 3 — Expo (Metro Bundler)
```
$env:NGROK_PATH="C:\ngrok\ngrok.exe"; npm start -- -c --tunnel
```
Expected output: QR code appears in the terminal.

---

## On Your iPhone
1. Open the **Camera app**
2. Point at the QR code
3. Tap the Expo Go notification

---

## Notes
- The `localhost.run` URL **changes every session** — always update `.env.local` with the new URL from Terminal 2 before starting Terminal 3.
- If port 8081/8082 is in use, Expo will ask to use a different port — press **y**.
- If port 8787 is in use, run: `netstat -ano | findstr :8787` then `taskkill /PID <number> /F`
- Get your ngrok authtoken at: https://dashboard.ngrok.com/get-started/your-authtoken
