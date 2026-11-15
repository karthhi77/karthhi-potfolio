# Liquid Glass Photography Portfolio

An ultra-modern, high-performance portfolio featuring real-time **Liquid Glassmorphism**, dynamic WebGL fluid physics, chromatic refraction dispersion, 3D card tilt with specular sheen, and client-side photo uploading with persistent **IndexedDB** storage.

---

## ✨ Features

- **Liquid Glass Aesthetics**:
  - Interactive **WebGL fluid simulation** with chromatic aberration and real-time mouse ripples.
  - Multi-layered frosted glass panels with `backdrop-filter: blur()`, specular highlight glares, and tactile noise grain.
  - Interactive 3D tilt cards that dynamically reflect light based on pointer position.
  - Fluid trailing custom cursor with viscous speed-deformation.

- **Photo Upload & Showcase**:
  - **In-Browser Upload Portal**: Drag & drop multiple photos directly onto the page, paste from clipboard (`Cmd+V` / `Ctrl+V`), or browse files.
  - **Persistent Storage**: Uploaded photos are stored permanently in your browser via **IndexedDB** — they stay saved even when you refresh or reopen the page.
  - **Category Filtering & Search**: Instant filtering across *Portraits*, *Landscape*, *Architecture*, *Street*, *Nature*, *Abstract*, *Favorites*, and *My Uploads*, with real-time text search.
  - **Fullscreen Lightbox**: Zoom & pan view, camera EXIF details (ISO, shutter speed, aperture, camera model), slideshow mode, download button, and deletion option.
  - **Portfolio Backup**: 1-click **Export Backup** to a `.json` file and **Import Backup** to restore collections on any device.
  - **Direct Folder Sync**: Drop images directly into the `images/` directory and run `npm run sync` (or click "Sync Folder" in the UI).

---

## 🚀 Quick Start

### 1. View in Browser
The local server is already running! Open in your browser:
```
http://localhost:3000
```

To run manually at any time:
```bash
npm start
```

*(You can also double-click `index.html` directly in Finder to use it fully offline with zero setup).*

---

## 📸 Adding Your Photos

### Method 1: Upload via the Website (Recommended)
1. Open `http://localhost:3000`.
2. Click **"Upload Photos"** (or simply drag and drop image files anywhere onto the window).
3. Set your photo titles, select categories, and click **"Save Photos"**.
4. Your photos immediately appear in the gallery and persist in your browser!

### Method 2: Drop Images into the Folder
1. Put any `.jpg`, `.png`, `.webp`, `.avif`, or `.svg` photos into the `/Users/karthik/Desktop/karthhi porfolio/images/` folder.
2. In the portfolio navigation bar, click **"Sync Folder"** (or run `npm run sync` in terminal).
3. The portfolio will automatically index and display them in your gallery.

---

## 📁 Project Structure

```
karthhi porfolio/
├── index.html              # Main HTML semantic layout & liquid structure
├── css/
│   ├── glass.css           # Glassmorphism variables, borders, specular lighting
│   ├── liquid-canvas.css   # WebGL canvas container, noise grain, fluid cursor
│   ├── components.css      # Grid, hero, lightbox, uploader, tabs & cards
│   └── main.css            # Unified entry point
├── js/
│   ├── liquid-bg.js        # WebGL fluid shader with chromatic dispersion
│   ├── liquid-cursor.js    # Fluid cursor physics & hover snapping
│   ├── db.js               # IndexedDB persistent storage for uploaded photos
│   ├── gallery.js          # Masonry grid, 3D tilt, categories, live search
│   ├── lightbox.js         # Fullscreen EXIF inspector, slideshow & controls
│   ├── uploader.js         # Drag & drop portal, multi-upload & EXIF parsing
│   └── app.js              # Application coordinator & toast notifications
├── images/
│   ├── manifest.json       # Auto-generated image manifest
│   ├── manifest.js         # Fallback manifest for offline double-click viewing
│   └── samples/            # Curated visual photography samples
├── server.js               # Zero-dependency local dev server with auto-indexing
├── sync-images.js          # Script to scan images folder
└── package.json            # Scripts & metadata
```
