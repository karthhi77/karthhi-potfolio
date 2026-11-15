const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const imagesDir = path.join(rootDir, 'images');
const manifestPath = path.join(imagesDir, 'manifest.json');
const manifestJsPath = path.join(imagesDir, 'manifest.js');

const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

function getImageDimensions(filePath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`, { encoding: 'utf8' });
    const widthMatch = out.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = out.match(/pixelHeight:\s*(\d+)/);
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1], 10),
        height: parseInt(heightMatch[1], 10)
      };
    }
  } catch (e) {}
  return { width: 1920, height: 1080 };
}

// Curated cinematic titles
const landscapeTitles = {
  'IMG_6143.jpg': 'Cinema Frame — Architectural Perspective',
  'IMG_5783.jpg': 'Cinema Frame — Monochromatic Depth',
  'IMG_6534.jpg': 'Cinema Frame — Urban Façade',
  'IMG_8452.jpg': 'Cinema Frame — Atmospheric Mist',
  'IMG_6145.jpg': 'Cinema Frame — Architectural Light',
  'IMG_6261.jpg': 'Cinema Frame — High-Contrast Monolith',
  'IMG_2923.jpg': 'Cinema Frame — Coastal Horizon',
  'IMG_5892.jpg': 'Cinema Frame — Widescreen Vista',
  'IMG_5899.jpg': 'Cinema Frame — Twilight Horizon',
  'eb007957-4dec-4560-8d7f-55a904a94fa0.jpg': 'Cinema Frame — Misty Forest Canopy',
  'IMG_7475.jpg': 'Cinema Frame — Solitude in Misty Woods',
  'IMG_9394.jpg': 'Cinema Frame — Atmospheric Canopy'
};

const portraitTitles = {
  'IMG_9847.jpg': 'Vertical Still — Silhouette Branches',
  'IMG_9391.jpg': 'Vertical Still — Verdant Light',
  'IMG_9393.jpg': 'Vertical Still — Canopy Ascent',
  'IMG_8927.jpg': 'Vertical Still — Architectural Pillar',
  'IMG_8444.jpg': 'Vertical Still — Fog Ascent',
  'IMG_6342.jpg': 'Vertical Still — Urban Tower',
  'IMG_0125.jpg': 'Vertical Still — Night Horizon',
  '52E6F6C6-ABB3-438A-965E-B4E7566388FA.jpg': 'Vertical Still — Street Frame',
  'E8382CD3-6928-4492-878D-3AB1BDCDDA09.JPEG': 'Vertical Still — Monolith Angle',
  'IMG_6156.jpg': 'Vertical Still — Cavern Solitude'
};

// Preferred display order for curated landscape hero showcase
const landscapePriority = [
  'IMG_6143.jpg',
  'IMG_5783.jpg',
  'IMG_6534.jpg',
  'IMG_8452.jpg',
  'IMG_6145.jpg',
  'IMG_6261.jpg',
  'IMG_2923.jpg',
  'IMG_5892.jpg',
  'IMG_5899.jpg',
  'eb007957-4dec-4560-8d7f-55a904a94fa0.jpg',
  'IMG_7475.jpg',
  'IMG_9394.jpg'
];

const portraitPriority = [
  'IMG_9847.jpg',
  'IMG_9391.jpg',
  'IMG_9393.jpg',
  'IMG_8927.jpg',
  'IMG_8444.jpg',
  'IMG_6342.jpg',
  'IMG_0125.jpg',
  '52E6F6C6-ABB3-438A-965E-B4E7566388FA.jpg',
  'E8382CD3-6928-4492-878D-3AB1BDCDDA09.JPEG',
  'IMG_6156.jpg'
];

function scanDir() {
  const files = fs.readdirSync(imagesDir);
  const rawList = [];

  for (const file of files) {
    const fullPath = path.join(imagesDir, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) {
      const ext = path.extname(file).toLowerCase();
      if (supportedExts.includes(ext) && !file.startsWith('.')) {
        const dims = getImageDimensions(fullPath);
        const ratio = dims.width / dims.height;
        const isLandscape = ratio >= 1.0;

        rawList.push({
          file,
          fullPath,
          dims,
          ratio,
          isLandscape,
          mtime: stat.mtime
        });
      }
    }
  }

  // Sort landscape according to priority
  const landscapes = rawList.filter(p => p.isLandscape).sort((a, b) => {
    const idxA = landscapePriority.indexOf(a.file);
    const idxB = landscapePriority.indexOf(b.file);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.mtime - a.mtime;
  });

  // Sort portraits according to priority
  const portraits = rawList.filter(p => !p.isLandscape).sort((a, b) => {
    const idxA = portraitPriority.indexOf(a.file);
    const idxB = portraitPriority.indexOf(b.file);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.mtime - a.mtime;
  });

  const ordered = [...landscapes, ...portraits];

  const manifest = ordered.map((item, index) => {
    const ext = path.extname(item.file);
    const rawName = path.basename(item.file, ext);
    const aspect = item.isLandscape ? 'landscape' : 'portrait';
    const category = item.isLandscape ? '16:9 Cinematic' : '9:16 Vertical';

    const cleanTitle = item.isLandscape
      ? (landscapeTitles[item.file] || `Cinema Frame #${String(index + 1).padStart(2, '0')}`)
      : (portraitTitles[item.file] || `Vertical Still #${String(index - landscapes.length + 1).padStart(2, '0')}`);

    return {
      id: `frame-${index + 1}-${rawName.slice(0, 16)}`,
      filename: item.file,
      url: `images/${item.file}`,
      title: cleanTitle,
      category,
      aspect,
      width: item.dims.width,
      height: item.dims.height,
      iso: '',
      shutter: '',
      aperture: '',
      camera: '',
      date: item.mtime.toISOString().split('T')[0],
      favorited: false,
      isSample: false
    };
  });

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(manifestJsPath, 'window.DEFAULT_MANIFEST = ' + JSON.stringify(manifest, null, 2) + ';\n', 'utf8');
  console.log(`[Sync] Manifest updated: ${landscapes.length} 16:9 landscapes (first), ${portraits.length} 9:16 portraits (second). Total: ${manifest.length}`);
  return manifest;
}

module.exports = { scanDir };

if (require.main === module) {
  scanDir();
}
