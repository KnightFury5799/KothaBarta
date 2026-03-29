# kothabarta · কথাবার্তা

> Anonymous messaging — say what you really feel.

A clean, dark-themed anonymous messaging web app. Create your profile, share your link, and receive honest anonymous messages from anyone.

## Features

- 🔒 **Anonymous sending** — no account needed to send
- 💌 **Personal inbox** — receive & manage your messages
- 🔗 **Shareable link** — one link to share anywhere
- ✨ **Read/unread tracking** — know what's new
- 🌙 **Dark UI** — elegant night theme with Bengali script accents

## Tech Stack

- **React 18** + **Vite**
- **localStorage** for data persistence (no backend needed)
- Zero external UI libraries — pure inline styles

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploying

### Vercel (recommended)
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Click Deploy — done!

### Netlify
1. Push to GitHub
2. Import at [netlify.com](https://netlify.com)
3. Build command: `npm run build` · Publish dir: `dist`

## Note on Data

Currently uses `localStorage` — data is stored in the browser and shared within the same device/browser. For a real multi-user experience, you'd connect a backend (e.g. Supabase + FastAPI).

---

Made with ❤️ · kothabarta
