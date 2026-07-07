# Echo — song recognizer

A Shazam-style app: record a short clip from your mic, match it against a real
song-fingerprint database, get back title, artist, artwork, and a streaming
link. Backend keeps your API key private; frontend just handles the mic and UI.

## Stack
- **Backend:** Node.js + Express, proxies recognition requests to [AudD](https://audd.io)
- **Frontend:** vanilla HTML/CSS/JS, served statically by the backend — no build step

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Get a free API token from [dashboard.audd.io](https://dashboard.audd.io).

3. Copy the env template and add your token:
   ```
   cp .env.example .env
   ```
   Then edit `.env` and set `AUDD_API_TOKEN= Add your Own`.

4. Start the server:
   ```
   npm start
   ```

5. Open **http://localhost:3000** in your browser (Chrome or Firefox recommended
   for mic support), allow microphone access, and hit **listen**.

## How recognition works
The frontend records ~8 seconds of audio via `MediaRecorder`, sends it to
`POST /api/recognize` on your own backend, which forwards it to AudD along with
your server-side API token, then relays back a clean JSON result. Your API
token never reaches the browser.

## Notes & limits
- AudD's free tier includes a limited number of monthly recognition requests —
  fine for testing, but you'll want a paid plan for regular/heavy use.
- Recognition works on commercially released music (the same kind of catalog
  Shazam itself draws from). Unreleased tracks, bootlegs, and original
  unpublished recordings won't match anything.
- Mic access in the browser requires either `localhost` or an `https://` origin.
  If you deploy this somewhere, make sure it's served over HTTPS.

## Project structure
```
song-recognizer-app/
├── server.js          # Express backend, proxies to AudD
├── package.json
├── .env.example       # copy to .env and add your token
└── public/
    └── index.html     # frontend UI
```
