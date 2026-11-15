/**
 * Application Master Controller
 * Dedicated to karthhi — Cinematographer | Editor
 * Initializes fluid background, cursor, database, uploader, gallery and lightbox
 */

// Toast notification helper
window.showToast = function(message, duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'glass-toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Liquid Background (WebGL / Canvas)
  try {
    new LiquidBackground('liquid-canvas');
  } catch (err) {
    console.warn('Could not start WebGL fluid shader:', err);
  }

  // 2. Initialize Liquid Cursor
  try {
    new LiquidCursor();
  } catch (err) {
    console.warn('Could not start Liquid Cursor:', err);
  }

  // 3. Initialize IndexedDB
  await window.PortfolioDB.init();

  // 4. Initialize Gallery, Lightbox, About Me & Admin Suite
  const gallery = new GalleryController();
  window.Lightbox = new Lightbox(gallery);
  new PhotoUploader(gallery);
  window.About = new AboutController();
  window.Admin = new AdminController(gallery);

  // 5. Load Ground-Truth Manifest Photos
  let manifestPhotos = [];
  try {
    const res = await fetch(`images/manifest.json?v=${Date.now()}`);
    if (res.ok) {
      manifestPhotos = await res.json();
    } else if (window.DEFAULT_MANIFEST) {
      manifestPhotos = [...window.DEFAULT_MANIFEST];
    }
  } catch (err) {
    if (window.DEFAULT_MANIFEST) {
      manifestPhotos = [...window.DEFAULT_MANIFEST];
    }
  }

  // 6. Merge Favorites from IndexedDB
  try {
    const favoriteIds = await window.PortfolioDB.getFavorites();
    manifestPhotos.forEach(p => {
      if (favoriteIds.has(p.id)) {
        p.favorited = true;
      }
    });
  } catch (err) {
    console.warn('Could not restore favorites:', err);
  }

  // 7. Load Real User Uploads from IndexedDB (data URLs or custom uploads)
  let userUploads = [];
  try {
    const dbPhotos = await window.PortfolioDB.getAllPhotos();
    userUploads = dbPhotos.filter(p => p.isUserUpload || (p.url && p.url.startsWith('data:')));
  } catch (err) {
    console.error('Error fetching user uploads:', err);
  }

  // Combine: 16:9 Landscape photos first, then 9:16 Portrait photos
  let allPhotos = [...manifestPhotos, ...userUploads];

  allPhotos.sort((a, b) => {
    const aLand = a.aspect === 'landscape' || (a.width >= a.height);
    const bLand = b.aspect === 'landscape' || (b.width >= b.height);
    if (aLand && !bLand) return -1;
    if (!aLand && bLand) return 1;
    return 0;
  });

  gallery.setPhotos(allPhotos);

  // 8. Connect Backup Export / Import
  const exportBtn = document.getElementById('export-backup-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const downloadUrl = await window.PortfolioDB.exportBackup();
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `karthhi-cinematography-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.showToast('Portfolio archive downloaded successfully');
      } catch (err) {
        window.showToast('Export failed: ' + err.message);
      }
    });
  }

  const importBtn = document.getElementById('import-backup-btn');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = await window.PortfolioDB.importBackup(text);
        window.showToast(`Imported ${count} frames successfully!`);
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        window.showToast('Import error: ' + err.message);
      }
    });
  }

  // 9. Quick Actions & Navigation
  const heroInstagram = document.getElementById('hero-instagram-btn');
  if (heroInstagram) {
    heroInstagram.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://instagram.com/karthhiy', '_blank', 'noopener');
    });
  }

  const btn16x9 = document.getElementById('hero-view-16-9-btn');
  if (btn16x9) {
    btn16x9.addEventListener('click', (e) => {
      e.preventDefault();
      if (gallery.currentCategory !== 'All' && gallery.currentCategory !== '16:9 Cinematic') {
        gallery.currentCategory = 'All';
        const tabs = document.querySelectorAll('.category-tabs .tab-btn');
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-category') === 'All'));
        gallery.render();
      }
      const el = document.getElementById('showcase-16-9');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const btn9x16 = document.getElementById('hero-view-9-16-btn');
  if (btn9x16) {
    btn9x16.addEventListener('click', (e) => {
      e.preventDefault();
      if (gallery.currentCategory !== 'All' && gallery.currentCategory !== '9:16 Vertical') {
        gallery.currentCategory = 'All';
        const tabs = document.querySelectorAll('.category-tabs .tab-btn');
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-category') === 'All'));
        gallery.render();
      }
      const el = document.getElementById('showcase-9-16');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});
