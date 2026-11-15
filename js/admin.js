/**
 * Private Admin Controller
 * Dedicated to karthhi — Cinematographer | Editor
 * Keyboard Shortcut: Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows/Linux)
 * Protects photo upload, delete, backup and private curator tools with password
 */

class AdminController {
  constructor(galleryController) {
    this.gallery = galleryController;

    // Modals
    this.authModal = document.getElementById('admin-auth-modal-backdrop');
    this.consoleModal = document.getElementById('admin-console-backdrop');

    // Auth elements
    this.authForm = document.getElementById('admin-auth-form');
    this.passwordInput = document.getElementById('admin-password-input');
    this.authError = document.getElementById('admin-auth-error');
    this.closeAuthBtn = document.getElementById('close-admin-auth-btn');

    // Console elements
    this.closeConsoleBtn = document.getElementById('close-admin-console-btn');
    this.lockBtn = document.getElementById('admin-lock-btn');
    this.tabs = document.querySelectorAll('.admin-tab-btn');
    this.tabContents = document.querySelectorAll('.admin-tab-content');

    // Upload tab
    this.dropzone = document.getElementById('admin-dropzone');
    this.fileInput = document.getElementById('admin-file-input');
    this.stagedContainer = document.getElementById('admin-staged-list');
    this.submitUploadBtn = document.getElementById('admin-submit-upload-btn');
    this.stagedFiles = [];

    // Manage tab
    this.framesList = document.getElementById('admin-frames-list');
    this.manageCountLabel = document.getElementById('admin-manage-count-label');
    this.manageTabBtn = document.getElementById('admin-tab-manage-btn');
    this.refreshManifestBtn = document.getElementById('admin-refresh-manifest-btn');

    // Backup tab
    this.exportBackupBtn = document.getElementById('admin-export-backup-btn');
    this.importBackupBtn = document.getElementById('admin-import-backup-btn');
    this.importFileInput = document.getElementById('admin-import-file-input');

    // Security tab
    this.changePwdForm = document.getElementById('admin-change-pwd-form');
    this.newPwdInput = document.getElementById('admin-new-password-input');
    this.confirmPwdInput = document.getElementById('admin-confirm-password-input');
    this.pwdMsg = document.getElementById('admin-pwd-msg');

    // Footer trigger
    this.footerTrigger = document.getElementById('footer-admin-trigger');

    this.bindEvents();
    this.syncAuthState();
  }

  getMasterPasswords() {
    const custom = localStorage.getItem('karthhi_admin_password');
    const valid = ['karthhi', 'karthhiy'];
    if (custom) valid.unshift(custom);
    return valid;
  }

  isAuthenticated() {
    return sessionStorage.getItem('karthhi_admin_active') === 'true';
  }

  syncAuthState() {
    const isAuth = this.isAuthenticated();
    const lbAdmin = document.getElementById('lightbox-admin-actions');
    if (lbAdmin) {
      lbAdmin.style.display = isAuth ? 'inline-flex' : 'none';
    }
  }

  openAuthModal() {
    if (this.authModal) {
      this.authModal.classList.add('active');
      if (this.authError) this.authError.style.display = 'none';
      if (this.passwordInput) {
        this.passwordInput.value = '';
        setTimeout(() => this.passwordInput.focus(), 150);
      }
    }
  }

  closeAuthModal() {
    if (this.authModal) {
      this.authModal.classList.remove('active');
    }
  }

  openConsole() {
    this.closeAuthModal();
    if (this.consoleModal) {
      this.consoleModal.classList.add('active');
      this.renderManageList();
      if (window.About) {
        window.About.populateForm();
      }
    }
  }

  closeConsole() {
    if (this.consoleModal) {
      this.consoleModal.classList.remove('active');
    }
  }

  login(password) {
    const validKeys = this.getMasterPasswords();
    if (validKeys.includes(password.trim())) {
      sessionStorage.setItem('karthhi_admin_active', 'true');
      this.syncAuthState();
      if (this.gallery) {
        this.gallery.renderCategories();
        this.gallery.render();
      }
      this.openConsole();
      window.showToast('Curator console unlocked');
      return true;
    } else {
      if (this.authError) {
        this.authError.style.display = 'block';
        this.authError.textContent = 'Incorrect password. Try again.';
      }
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem('karthhi_admin_active');
    this.syncAuthState();
    if (this.gallery) {
      this.gallery.renderCategories();
      this.gallery.render();
    }
    this.closeConsole();
    window.showToast('Curator session locked');
  }

  bindEvents() {
    // 1. Secret Keyboard Shortcuts: Cmd+Shift+A (Mac) or Ctrl+Shift+A (Win/Linux) or Alt+A
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isKeyA = e.key === 'a' || e.key === 'A';

      if ((isCmdOrCtrl && isShift && isKeyA) || (e.altKey && isKeyA)) {
        e.preventDefault();
        if (this.isAuthenticated()) {
          if (this.consoleModal && this.consoleModal.classList.contains('active')) {
            this.closeConsole();
          } else {
            this.openConsole();
          }
        } else {
          this.openAuthModal();
        }
      }
    });

    // 1b. Direct URL Hash Trigger: visiting #admin in browser
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (this.isAuthenticated()) {
          this.openConsole();
        } else {
          this.openAuthModal();
        }
      }
    };
    window.addEventListener('hashchange', checkHash);
    setTimeout(checkHash, 100);

    // 2. Secret footer trigger
    if (this.footerTrigger) {
      this.footerTrigger.addEventListener('click', () => {
        if (this.isAuthenticated()) {
          this.openConsole();
        } else {
          this.openAuthModal();
        }
      });
    }

    // 3. Auth Form Submit
    if (this.authForm) {
      this.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = this.passwordInput.value;
        this.login(pwd);
      });
    }

    if (this.closeAuthBtn) {
      this.closeAuthBtn.addEventListener('click', () => this.closeAuthModal());
    }

    if (this.authModal) {
      this.authModal.addEventListener('click', (e) => {
        if (e.target === this.authModal) this.closeAuthModal();
      });
    }

    // 4. Console Close & Lock
    if (this.closeConsoleBtn) {
      this.closeConsoleBtn.addEventListener('click', () => this.closeConsole());
    }

    if (this.lockBtn) {
      this.lockBtn.addEventListener('click', () => this.logout());
    }

    if (this.consoleModal) {
      this.consoleModal.addEventListener('click', (e) => {
        if (e.target === this.consoleModal) this.closeConsole();
      });
    }

    // 5. Admin Tabs Navigation
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        this.tabs.forEach(t => t.classList.remove('active'));
        this.tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const contentEl = document.getElementById(`admin-tab-${target}`);
        if (contentEl) contentEl.classList.add('active');

        if (target === 'manage') {
          this.renderManageList();
        }

        if (target === 'profile' && window.About) {
          window.About.populateForm();
        }
      });
    });

    // 6. Admin Uploads (Dropzone & Input)
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput.click());

      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone.classList.add('dragover');
      });

      this.dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('dragover');
      });

      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) this.handleFiles(files);
      });

      this.fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) this.handleFiles(files);
        this.fileInput.value = '';
      });
    }

    if (this.submitUploadBtn) {
      this.submitUploadBtn.addEventListener('click', () => this.commitUploads());
    }

    // 7. Refresh Manifest
    if (this.refreshManifestBtn) {
      this.refreshManifestBtn.addEventListener('click', async () => {
        await this.syncDiskManifest();
      });
    }

    // 8. Backup / Export
    if (this.exportBackupBtn) {
      this.exportBackupBtn.addEventListener('click', async () => {
        try {
          const url = await window.PortfolioDB.exportBackup();
          const a = document.createElement('a');
          a.href = url;
          a.download = `karthhi-archive-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.showToast('Full archive exported successfully');
        } catch (err) {
          window.showToast('Export failed: ' + err.message);
        }
      });
    }

    if (this.importBackupBtn && this.importFileInput) {
      this.importBackupBtn.addEventListener('click', () => this.importFileInput.click());
      this.importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const count = await window.PortfolioDB.importBackup(text);
          window.showToast(`Restored ${count} frames! Reloading...`);
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          window.showToast('Import error: ' + err.message);
        }
      });
    }

    // 9. Change Password
    if (this.changePwdForm) {
      this.changePwdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const p1 = this.newPwdInput.value.trim();
        const p2 = this.confirmPwdInput.value.trim();

        if (p1.length < 4) {
          this.showPwdMsg('Password must be at least 4 characters.', true);
          return;
        }

        if (p1 !== p2) {
          this.showPwdMsg('Passwords do not match.', true);
          return;
        }

        localStorage.setItem('karthhi_admin_password', p1);
        this.newPwdInput.value = '';
        this.confirmPwdInput.value = '';
        this.showPwdMsg('Master password updated successfully!', false);
        window.showToast('Master password changed');
      });
    }
  }

  showPwdMsg(text, isError) {
    if (!this.pwdMsg) return;
    this.pwdMsg.style.display = 'block';
    this.pwdMsg.style.color = isError ? '#ff5252' : '#00e5ff';
    this.pwdMsg.textContent = text;
    setTimeout(() => {
      this.pwdMsg.style.display = 'none';
    }, 4000);
  }

  async handleFiles(files) {
    for (const file of files) {
      const dataUrl = await this.readFileAsDataURL(file);
      const dims = await this.getImageDimensions(dataUrl);
      const isLandscape = dims.width >= dims.height;

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = isLandscape ? `Cinema Frame — ${baseName}` : `Vertical Still — ${baseName}`;

      this.stagedFiles.push({
        id: 'upload-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        file,
        dataUrl,
        filename: file.name,
        title: cleanTitle,
        category: isLandscape ? '16:9 Cinematic' : '9:16 Vertical',
        aspect: isLandscape ? 'landscape' : 'portrait',
        width: dims.width,
        height: dims.height,
        date: new Date().toISOString().split('T')[0]
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
      img.onload = () => resolve({ width: img.naturalWidth || 1920, height: img.naturalHeight || 1080 });
      img.src = dataUrl;
    });
  }

  renderStaged() {
    if (!this.stagedContainer) return;

    if (this.stagedFiles.length === 0) {
      this.stagedContainer.innerHTML = '';
      if (this.submitUploadBtn) this.submitUploadBtn.style.display = 'none';
      return;
    }

    if (this.submitUploadBtn) {
      this.submitUploadBtn.style.display = 'inline-flex';
    }

    this.stagedContainer.innerHTML = `
      <div style="font-size: 0.85rem; color: var(--accent-cyan); font-family: var(--font-mono); margin-bottom: 8px;">
        Frames to Upload (${this.stagedFiles.length}):
      </div>
      ${this.stagedFiles.map((item, idx) => `
        <div class="staged-item">
          <img class="staged-thumb ${item.aspect}" src="${item.dataUrl}" alt="Preview"/>
          <div class="staged-details">
            <div class="staged-inputs">
              <input type="text" class="staged-text-input staged-admin-title" data-idx="${idx}" value="${item.title}" placeholder="Frame Title"/>
              <select class="staged-text-input staged-admin-cat" data-idx="${idx}">
                <option value="16:9 Cinematic" ${item.aspect === 'landscape' ? 'selected' : ''}>16:9 Cinematic</option>
                <option value="9:16 Vertical" ${item.aspect === 'portrait' ? 'selected' : ''}>9:16 Vertical</option>
              </select>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">
              ${item.width} × ${item.height}px • ${item.aspect === 'landscape' ? '16:9 Widescreen' : '9:16 Vertical'}
            </div>
          </div>
          <button class="staged-remove-btn staged-admin-remove" data-idx="${idx}" title="Remove">✕</button>
        </div>
      `).join('')}
    `;

    this.stagedContainer.querySelectorAll('.staged-admin-title').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        this.stagedFiles[idx].title = e.target.value;
      });
    });

    this.stagedContainer.querySelectorAll('.staged-admin-cat').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        const val = e.target.value;
        this.stagedFiles[idx].category = val;
        this.stagedFiles[idx].aspect = val.includes('16:9') ? 'landscape' : 'portrait';
      });
    });

    this.stagedContainer.querySelectorAll('.staged-admin-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.stagedFiles.splice(idx, 1);
        this.renderStaged();
      });
    });
  }

  async commitUploads() {
    if (this.stagedFiles.length === 0) return;

    this.submitUploadBtn.disabled = true;
    this.submitUploadBtn.innerHTML = `<span>Saving...</span>`;

    const count = this.stagedFiles.length;

    for (const item of this.stagedFiles) {
      const saved = await window.PortfolioDB.addPhoto({
        id: item.id,
        url: item.dataUrl,
        filename: item.filename,
        title: item.title,
        category: item.category,
        aspect: item.aspect,
        width: item.width,
        height: item.height,
        date: item.date,
        favorited: false,
        isUserUpload: true
      });

      // Background upload to disk if server running
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

      this.gallery.photos.push(saved);
    }

    // Sort landscapes first
    this.gallery.photos.sort((a, b) => {
      const aLand = a.aspect === 'landscape' || (a.width >= a.height);
      const bLand = b.aspect === 'landscape' || (b.width >= b.height);
      if (aLand && !bLand) return -1;
      if (!aLand && bLand) return 1;
      return 0;
    });

    this.gallery.setPhotos(this.gallery.photos);

    this.stagedFiles = [];
    this.renderStaged();
    this.submitUploadBtn.disabled = false;
    this.renderManageList();

    window.showToast(`✨ ${count} photograph${count > 1 ? 's' : ''} saved to showcase!`);
  }

  renderManageList() {
    if (!this.framesList) return;

    const photos = this.gallery.photos || [];
    const total = photos.length;

    if (this.manageCountLabel) {
      this.manageCountLabel.textContent = `Total Showcase Frames: ${total}`;
    }

    if (this.manageTabBtn) {
      this.manageTabBtn.textContent = `Manage & Delete (${total})`;
    }

    if (total === 0) {
      this.framesList.innerHTML = `<div style="color:var(--text-dim); padding:20px; text-align:center;">No frames found.</div>`;
      return;
    }

    this.framesList.innerHTML = photos.map(photo => {
      const isLand = photo.aspect === 'landscape';
      const badge = isLand ? '16:9 CINEMA' : '9:16 VERTICAL';
      const thumbClass = isLand ? '' : 'portrait';

      return `
        <div class="admin-frame-row" data-id="${photo.id}">
          <div class="admin-frame-info">
            <img class="admin-frame-thumb ${thumbClass}" src="${photo.url}" alt="${photo.title}"/>
            <div>
              <div class="admin-frame-title">${photo.title}</div>
              <div class="admin-frame-sub">
                <span class="mono-badge-white" style="font-size:0.65rem; padding:2px 6px;">${badge}</span>
                <span style="margin-left:8px;">${photo.width} × ${photo.height}px</span>
                <span style="margin-left:8px;">•</span>
                <span style="margin-left:8px;">${photo.filename || photo.id}</span>
              </div>
            </div>
          </div>
          <button class="admin-del-btn" data-id="${photo.id}" data-filename="${photo.filename || ''}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      `;
    }).join('');

    // Bind delete buttons
    this.framesList.querySelectorAll('.admin-del-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const filename = btn.getAttribute('data-filename');
        await this.deleteFrame(id, filename);
      });
    });
  }

  async deleteFrame(id, filename) {
    const photo = this.gallery.photos.find(p => p.id === id);
    const title = photo ? photo.title : 'this frame';

    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    // 1. Delete from IndexedDB
    try {
      await window.PortfolioDB.deletePhoto(id);
    } catch (e) {
      console.warn('DB delete error:', e);
    }

    // 2. Delete from disk via server if filename exists
    if (filename && window.location.protocol.startsWith('http')) {
      try {
        await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename })
        });
      } catch (e) {
        console.warn('Disk delete error:', e);
      }
    }

    // 3. Remove from active gallery
    this.gallery.photos = this.gallery.photos.filter(p => p.id !== id);
    this.gallery.setPhotos(this.gallery.photos);

    // 4. Update UI
    this.renderManageList();
    window.showToast(`Deleted "${title}"`);
  }

  async syncDiskManifest() {
    if (!window.location.protocol.startsWith('http')) {
      window.showToast('Re-scan requires active server.');
      return;
    }

    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        window.showToast(`Synced ${data.count} frames from images folder!`);
        setTimeout(() => location.reload(), 800);
      }
    } catch (err) {
      window.showToast('Sync error: ' + err.message);
    }
  }
}

window.AdminController = AdminController;
