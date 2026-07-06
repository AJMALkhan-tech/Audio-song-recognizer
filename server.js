require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const AUDD_API_TOKEN = process.env.AUDD_API_TOKEN || '';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB cap, plenty for an 8s clip
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Lets the frontend check whether the server is configured, without exposing the token
app.get('/api/status', (req, res) => {
  res.json({ configured: Boolean(AUDD_API_TOKEN) });
});

app.post('/api/recognize', upload.single('audio'), async (req, res) => {
  if (!AUDD_API_TOKEN) {
    return res.status(500).json({
      error: 'Server is missing an AudD API token. Add AUDD_API_TOKEN to your .env file and restart the server.'
    });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file received.' });
  }

  try {
    const form = new FormData();
    form.append('api_token', AUDD_API_TOKEN);
    form.append('return', 'apple_music,spotify');
    form.append('file', new Blob([req.file.buffer]), 'clip.webm');

    const aududRes = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: form
    });

    const data = await aududRes.json();

    if (data.status !== 'success') {
      const message = data.error && data.error.error_message
        ? data.error.error_message
        : 'Recognition service returned an error.';
      return res.status(502).json({ error: message });
    }

    if (!data.result) {
      return res.json({ match: null });
    }

    const r = data.result;
    const artwork =
      (r.spotify && r.spotify.album && r.spotify.album.images && r.spotify.album.images[0])
        ? r.spotify.album.images[0].url
        : (r.apple_music && r.apple_music.artwork
            ? r.apple_music.artwork.url.replace('{w}', '300').replace('{h}', '300')
            : '');
    const link =
      (r.spotify && r.spotify.external_urls && r.spotify.external_urls.spotify)
        ? r.spotify.external_urls.spotify
        : (r.apple_music && r.apple_music.url ? r.apple_music.url : (r.song_link || ''));

    return res.json({
      match: {
        title: r.title || 'Unknown title',
        artist: r.artist || 'Unknown artist',
        album: r.album || '',
        release: r.release_date || '',
        art: artwork,
        link
      }
    });
  } catch (err) {
    console.error('Recognition error:', err);
    return res.status(500).json({ error: 'Could not reach the recognition service. Try again in a moment.' });
  }
});

app.listen(PORT, () => {
  console.log(`Echo server running at http://localhost:${PORT}`);
  if (!AUDD_API_TOKEN) {
    console.warn('Warning: AUDD_API_TOKEN is not set. Copy .env.example to .env and add your token.');
  }
});
