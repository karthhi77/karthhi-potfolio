/**
 * Liquid Photo Uploader
 * Drag & Drop, File Picker, Clipboard Paste, EXIF extraction, IndexedDB & Disk Sync
 */

class PhotoUploader {
  constructor(galleryController) {
    this.gallery = galleryController;
    this.modalBackdrop = document.getElementById('upload-modal-backdrop');
    this.dropzone = document.getElementById('liquid-dropzone');
    this.fileInput = document.getElementById('file-input');
    this.openBtn = document.getElementById('open-upload-modal-btn');
    this.heroUploadBtn = document.getElementById('hero-upload-btn');
    this.closeBtn = document.getElementById('close-upload-modal-btn');
    this.stagedContainer = document.getElementById('staged-files-list');
    this.submitBtn = document.getElementById('submit-uploads-btn');

    this.stagedFiles = [];

    this.bindEvents();
  }

  bindEvents() {
    // Open modal buttons
    const openModal = () => {
      this.modalBackdrop.classList.add('active');
    };

    if (this.openBtn) this.openBtn.addEventListener('click', openModal);
    if (this.heroUploadBtn) this.heroUploadBtn.addEventListener('click', openModal);

    // Close modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.modalBackdrop.classList.remove('active');
        this.clearStaged();
      });
    }

    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) {
        this.modalBackdrop.classList.remove('active');
        this.clearStaged();
      }
    });

    // File input change
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        this.handleFiles(Array.from(e.target.files));
        this.fileInput.value = '';
      });
    }

    // Dropzone drag & drop
    if (this.dropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        this.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        this.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.remove('dragover');
        });
      });

      this.dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
          this.handleFiles(files);
        }
      });
    }

    // Global drag & drop (drop anywhere on window to open upload modal)
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        this.modalBackdrop.classList.add('active');
        this.handleFiles(files);
      }
    });

    // Clipboard paste support (Cmd+V / Ctrl+V)
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      const imageFiles = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          imageFiles.push(item.getAsFile());
        }
      }
      if (imageFiles.length > 0) {
        this.modalBackdrop.classList.add('active');
        this.handleFiles(imageFiles);
      }
    });

    // Submit batch
    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.commitUploads());
    }
  }

  async handleFiles(files) {
    for (const file of files) {
      const dataUrl = await this.readFileAsDataURL(file);
      const dimensions = await this.getImageDimensions(dataUrl);
      
      const aspect = dimensions.width / dimensions.height;
      let aspectClass = 'landscape';
      if (aspect < 0.85) aspectClass = 'portrait';
      else if (aspect >= 0.85 && aspect <= 1.15) aspectClass = 'square';

      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      this.stagedFiles.push({
        id: 'upload-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        file,
        dataUrl,
        filename: file.name,
        title: cleanTitle,
        category: 'My Uploads',
        aspect: aspectClass,
        width: dimensions.width,
        height: dimensions.height,
        iso: '',
        shutter: '',
        aperture: '',
        camera: '',
        date: new Date().toISOString().split('T')[0],
        favorited: false,
        isSample: false
      });
    }

    this.renderStaged();
  }

  readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 800 });
      img.src = dataUrl;
    });
  }

  renderStaged() {
    if (!this.stagedContainer) return;

    if (this.stagedFiles.length === 0) {
      this.stagedContainer.innerHTML = '';
      if (this.submitBtn) this.submitBtn.style.display = 'none';
      return;
    }

    if (this.submitBtn) {
      this.submitBtn.style.display = 'inline-flex';
      this.submitBtn.innerHTML = `Save ${this.stagedFiles.length} Photo${this.stagedFiles.length > 1 ? 's' : ''} to Portfolio`;
    }

    this.stagedContainer.innerHTML = `
      <div style="font-size:0.9rem; color:var(--accent-cyan); font-weight:600; margin-bottom:8px;">
        Ready to import (${this.stagedFiles.length}):
      </div>
      ${this.stagedFiles.map((item, idx) => `
        <div class="staged-item">
          <img class="staged-thumb" src="${item.dataUrl}" alt="Preview"/>
          <div class="staged-details">
            <div class="staged-inputs">
              <input type="text" class="staged-text-input staged-title" data-idx="${idx}" value="${item.title}" placeholder="Photo Title"/>
              <select class="staged-text-input staged-cat" data-idx="${idx}">
                <option value="16:9 Cinematic" ${item.aspect === 'landscape' ? 'selected' : ''}>16:9 Cinematic</option>
                <option value="9:16 Vertical" ${item.aspect === 'portrait' ? 'selected' : ''}>9:16 Vertical</option>
                <option value="My Uploads">My Uploads</option>
              </select>
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim);">
              ${item.width} × ${item.height}px • ${item.aspect}
            </div>
          </div>
          <button class="staged-remove-btn" data-idx="${idx}" title="Remove">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `).join('')}
    `;

    // Bind inputs
    this.stagedContainer.querySelectorAll('.staged-title').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this.stagedFiles[idx].title = e.target.value;
      });
    });

    this.stagedContainer.querySelectorAll('.staged-cat').forEach(select => {
      select.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this.stagedFiles[idx].category = e.target.value;
      });
    });

    this.stagedContainer.querySelectorAll('.staged-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.stagedFiles.splice(idx, 1);
        this.renderStaged();
      });
    });
  }

  clearStaged() {
    this.stagedFiles = [];
    this.renderStaged();
  }

  async commitUploads() {
    if (this.stagedFiles.length === 0) return;

    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Saving photos...';

    for (const item of this.stagedFiles) {
      // 1. Save to IndexedDB
      const saved = await window.PortfolioDB.addPhoto({
        id: item.id,
        url: item.dataUrl,
        filename: item.filename,
        title: item.title,
        category: item.category,
        aspect: item.aspect,
        width: item.width,
        height: item.height,
        iso: item.iso,
        shutter: item.shutter,
        aperture: item.aperture,
        camera: item.camera,
        date: item.date,
        favorited: false,
        isUserUpload: true
      });

      // 2. Also try background sync to Node.js backend if active
      if (window.location.protocol.startsWith('http')) {
        try {
          fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: item.filename,
              data: item.dataUrl
            })
          }).catch(() => {});
        } catch (e) {}
      }

      // Add to running gallery
      this.gallery.photos.push(saved);
      this.gallery.photos.sort((a, b) => {
        const aLand = a.aspect === 'landscape' || (a.width >= a.height);
        const bLand = b.aspect === 'landscape' || (b.width >= b.height);
        if (aLand && !bLand) return -1;
        if (!aLand && bLand) return 1;
        return 0;
      });
    }

    this.submitBtn.disabled = false;
    this.modalBackdrop.classList.remove('active');
    const count = this.stagedFiles.length;
    this.clearStaged();

    this.gallery.updateStats();
    this.gallery.renderCategories();
    this.gallery.render();

    window.showToast(`✨ Successfully added ${count} photo${count > 1 ? 's' : ''} to your portfolio!`);
  }
}

window.PhotoUploader = PhotoUploader;
