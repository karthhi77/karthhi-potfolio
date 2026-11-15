/**
 * About Me Controller (Cinematographer | Editor)
 * Manages the premium About interface, Instagram integration, and profile details
 */

class AboutController {
  constructor() {
    this.storageKey = 'karthhi_portfolio_about_v2';
    this.modalBackdrop = document.getElementById('about-modal-backdrop');
    this.openBtn = document.getElementById('open-about-btn');
    this.closeBtn = document.getElementById('close-about-modal-btn');
    this.saveBtn = document.getElementById('save-about-btn');

    this.viewModeEl = document.getElementById('about-view-mode');
    this.editModeEl = document.getElementById('about-edit-mode');

    // View Elements
    this.viewName = document.getElementById('view-about-name');
    this.viewRole = document.getElementById('view-about-role');
    this.viewInstagram = document.getElementById('view-about-instagram');
    this.viewBio = document.getElementById('view-about-bio');
    this.viewEmail = document.getElementById('view-about-email');
    this.instagramLink = document.getElementById('about-instagram-link');
    this.emailLink = document.getElementById('about-email-link');

    // Input Elements
    this.nameInput = document.getElementById('about-input-name');
    this.titleInput = document.getElementById('about-input-title');
    this.bioInput = document.getElementById('about-input-bio');
    this.locationInput = document.getElementById('about-input-location');
    this.emailInput = document.getElementById('about-input-email');
    this.instagramInput = document.getElementById('about-input-instagram');

    this.isEditing = false;
    this.data = this.loadData();
    this.init();
  }

  loadData() {
    const defaultData = {
      name: 'karthhi',
      role: 'CINEMATOGRAPHER | EDITOR',
      instagram: '@karthhiy',
      bio: 'Cinematographer and Film Editor dedicated to visual narrative, atmospheric lighting, and precise montage rhythm. Specializing in dramatic widescreen composition (16:9) and high-impact vertical motion (9:16), I sculpt light, shadows, and temporal pacing to evoke raw cinematic presence.',
      location: 'Available Worldwide',
      email: 'karthhi@visuals.film'
    };

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.instagram === '@karthhi' || parsed.instagram === 'karthhi') {
          parsed.instagram = '@karthhiy';
        }
        return Object.assign(defaultData, parsed);
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
    return defaultData;
  }

  saveData(data) {
    this.data = Object.assign(this.data, data);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
    this.updateUI();
  }

  init() {
    this.updateUI();
    this.bindEvents();
  }

  bindEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }

    const navAboutLink = document.getElementById('nav-about-link');
    if (navAboutLink) {
      navAboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }

    // Hero Instagram button
    const heroInstaBtn = document.getElementById('hero-instagram-btn');
    if (heroInstaBtn) {
      heroInstaBtn.addEventListener('click', (e) => {
        const handle = (this.data.instagram || 'karthhi').replace('@', '').trim();
        if (handle) {
          heroInstaBtn.href = `https://instagram.com/${handle}`;
          heroInstaBtn.target = '_blank';
        } else {
          e.preventDefault();
          this.open();
        }
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalBackdrop) {
      this.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this.modalBackdrop) this.close();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalBackdrop && this.modalBackdrop.classList.contains('active')) {
        this.close();
      }
    });

    // Toggle Edit Mode
    if (this.toggleEditBtn) {
      this.toggleEditBtn.addEventListener('click', () => {
        this.setEditMode(!this.isEditing);
      });
    }

    if (this.cancelEditBtn) {
      this.cancelEditBtn.addEventListener('click', () => {
        this.setEditMode(false);
      });
    }

    // Save Profile (inside Admin Console)
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => {
        const cleanInstagram = this.instagramInput ? this.instagramInput.value.trim() : this.data.instagram;
        const normalizedInsta = cleanInstagram.startsWith('@') ? cleanInstagram : '@' + cleanInstagram;

        this.saveData({
          name: this.nameInput ? this.nameInput.value.trim() : this.data.name,
          role: this.titleInput ? this.titleInput.value.trim().toUpperCase() : this.data.role,
          instagram: normalizedInsta,
          bio: this.bioInput ? this.bioInput.value.trim() : this.data.bio,
          location: this.locationInput ? this.locationInput.value.trim() : this.data.location,
          email: this.emailInput ? this.emailInput.value.trim() : this.data.email
        });

        if (window.showToast) {
          window.showToast('✨ Curator profile & bio saved successfully!');
        }
      });
    }
  }

  open() {
    if (this.modalBackdrop) {
      this.modalBackdrop.classList.add('active');
    }
  }

  close() {
    if (this.modalBackdrop) {
      this.modalBackdrop.classList.remove('active');
    }
  }

  populateForm() {
    if (this.nameInput) this.nameInput.value = this.data.name || '';
    if (this.titleInput) this.titleInput.value = this.data.role || 'CINEMATOGRAPHER | EDITOR';
    if (this.instagramInput) this.instagramInput.value = this.data.instagram || '@karthhiy';
    if (this.bioInput) this.bioInput.value = this.data.bio || '';
    if (this.locationInput) this.locationInput.value = this.data.location || '';
    if (this.emailInput) this.emailInput.value = this.data.email || '';
  }

  updateUI() {
    if (this.viewName) this.viewName.textContent = this.data.name || 'karthhi';
    if (this.viewRole) this.viewRole.textContent = this.data.role || 'CINEMATOGRAPHER | EDITOR';
    if (this.viewInstagram) this.viewInstagram.textContent = this.data.instagram || '@karthhiy';
    if (this.viewBio) this.viewBio.textContent = this.data.bio || '';
    if (this.viewEmail) this.viewEmail.textContent = `Inquiries: ${this.data.email || 'karthhi@visuals.film'}`;

    const cleanHandle = (this.data.instagram || '@karthhiy').replace('@', '').trim();
    if (this.instagramLink) {
      this.instagramLink.href = `https://instagram.com/${cleanHandle}`;
    }
    if (this.emailLink) {
      this.emailLink.href = `mailto:${this.data.email || 'karthhi@visuals.film'}`;
    }

    const heroInstaBtn = document.getElementById('hero-instagram-btn');
    if (heroInstaBtn) {
      heroInstaBtn.href = `https://instagram.com/${cleanHandle}`;
      heroInstaBtn.target = '_blank';
    }

    if (this.data.name) {
      document.title = `${this.data.name} — Cinematographer | Editor`;
    }
  }
}

window.AboutController = AboutController;
