# 🛒 GoodList Chrome Extension

> Your productive new tab that gives back.

## Quick Start (Load in Chrome)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select this `GoodList` folder
5. Open a new tab — you're live!

## Before You Ship: Add Your API Keys

Open `js/newtab.js` and replace the placeholders at the top:

```js
const CONFIG = {
  UNSPLASH_KEY: 'YOUR_UNSPLASH_ACCESS_KEY',   // free at unsplash.com/developers
  WEATHER_KEY:  'YOUR_OPENWEATHERMAP_KEY',    // free at openweathermap.org/api
  ...
};
```

## Project Structure

```
GoodList/
├── manifest.json        Chrome extension config (MV3)
├── index.html           New tab page
├── css/
│   └── style.css        All styling
├── js/
│   ├── newtab.js        Clock, focus, search, wishlist display, todos
│   ├── background.js    Service worker: context menu + scraper + price watch
│   └── content.js       Content script (Phase 3 placeholder)
└── icons/
    ├── icon16.png        ← You need to add these
    ├── icon48.png        ← Use any 16x16, 48x48, 128x128 PNG
    └── icon128.png       ← Green shopping bag recommended
```

## Icons

You need to add 3 icon files before Chrome will load the extension:
- `icons/icon16.png`   (16×16px)
- `icons/icon48.png`   (48×48px)  
- `icons/icon128.png`  (128×128px)

Quick option: use any green shopping bag emoji exported as PNG, or generate
free icons at https://favicon.io

## Phase Roadmap

| Phase | Status | What's built |
|-------|--------|-------------|
| 1 - MVP Skeleton | ✅ Done | Clock, focus, search bar, layout |
| 2 - The Collector | ✅ Done | Context menu, og: scraper, price watch |
| 3 - Monetization | ⏳ Next | Sovrn affiliate links, Coinis search, Supabase counter |
| 4 - Polish & Publish | ⏳ Soon | Deal of the Day, screenshots, Chrome Store |

## Phase 3 Checklist

- [ ] Register at [Sovrn Commerce](https://commerce.sovrn.com) for affiliate magic links
- [ ] Replace `affiliateUrl: null` in background.js with Sovrn API call
- [ ] Sign up for [Coinis](https://coinis.com) or [CodeFuel](https://www.codefuel.com) — replace `CONFIG.SEARCH_URL`
- [ ] Create free [Supabase](https://supabase.com) project → replace `loadImpactMeter()` placeholder in newtab.js
