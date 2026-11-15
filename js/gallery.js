/**
 * Gallery View Controller
 * Masonry grid, 3D card tilt, specular glass gleam, category filtering, search & sort
 */

class GalleryController {
  constructor() {
    this.container = document.getElementById('gallery-grid');
    this.categoryTabsContainer = document.getElementById('category-tabs');
    this.searchInput = document.getElementById('search-input');
    this.sortSelect = document.getElementById('sort-select');
    this.photoCountEl = document.getElementById('stat-total-photos');
    this.categoriesCountEl = document.getElementById('stat-total-categories');
    this.uploadsCountEl = document.getElementById('stat-user-uploads');
    this.navPhotoCountEl = document.getElementById('nav-photo-count');

    this.photos = [];
    this.currentCategory = 'All';
    this.searchQuery = '';
    this.sortBy = 'newest';

    this.bindEvents();
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }
  }

  setPhotos(photos) {
    this.photos = photos;
    this.updateStats();
    this.renderCategories();
    this.render();
  }

  updateStats() {
    const total = this.photos.length;
    const categories = new Set(this.photos.map(p => p.category)).size;
    const uploads = this.photos.filter(p => p.isUserUpload || (p.url && p.url.startsWith('data:'))).length;

    if (this.photoCountEl) this.photoCountEl.textContent = total;
    if (this.categoriesCountEl) this.categoriesCountEl.textContent = categories;
    if (this.uploadsCountEl) this.uploadsCountEl.textContent = uploads;
    if (this.navPhotoCountEl) this.navPhotoCountEl.textContent = total;
  }

  renderCategories() {
    if (!this.categoryTabsContainer) return;

    const allCategories = ['All', '16:9 Cinematic', '9:16 Vertical'];
    if (window.Admin && window.Admin.isAuthenticated()) {
      allCategories.push('Favorites');
    }

    this.categoryTabsContainer.innerHTML = allCategories.map(cat => {
      const activeClass = this.currentCategory === cat ? 'active' : '';
      return `<button class="tab-btn ${activeClass}" data-category="${cat}">${cat}</button>`;
    }).join('');

    this.categoryTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.categoryTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.getAttribute('data-category');
        this.render();
      });
    });
  }

  getFilteredPhotos() {
    let filtered = [...this.photos];

    // Filter by category
    if (this.currentCategory === 'Favorites') {
      filtered = filtered.filter(p => p.favorited);
    } else if (this.currentCategory === 'My Uploads') {
      filtered = filtered.filter(p => p.isUserUpload || (p.url && p.url.startsWith('data:')));
    } else if (this.currentCategory === '16:9 Cinematic') {
      filtered = filtered.filter(p => p.aspect === 'landscape');
    } else if (this.currentCategory === '9:16 Vertical') {
      filtered = filtered.filter(p => p.aspect === 'portrait');
    } else if (this.currentCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.currentCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(p => {
        const titleMatch = (p.title || '').toLowerCase().includes(this.searchQuery);
        const catMatch = (p.category || '').toLowerCase().includes(this.searchQuery);
        return titleMatch || catMatch;
      });
    }

    // Always sort 16:9 landscape FIRST
    filtered.sort((a, b) => {
      if (a.aspect === 'landscape' && b.aspect !== 'landscape') return -1;
      if (a.aspect !== 'landscape' && b.aspect === 'landscape') return 1;

      if (this.sortBy === 'newest') {
        return new Date(b.date || 0) - new Date(a.date || 0);
      } else if (this.sortBy === 'oldest') {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } else if (this.sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (this.sortBy === 'favorites') {
        return (b.favorited ? 1 : 0) - (a.favorited ? 1 : 0);
      }
      return 0;
    });

    return filtered;
  }

  renderCard(photo, index) {
    const aspectClass = photo.aspect || 'landscape';
    const favClass = photo.favorited ? 'favorited' : '';
    const badgeLabel = photo.aspect === 'landscape' ? '16:9 CINEMA' : '9:16 VERTICAL';

    return `
      <div class="glass-card photo-card ${aspectClass}" data-id="${photo.id}" style="animation: fadeInUp 0.4s ease forwards ${index * 0.03}s;">
        <div class="specular-sheen"></div>
        <div class="photo-frame">
          <img class="photo-img" src="${photo.url}" alt="${photo.title}" loading="lazy"/>
          <div class="photo-overlay">
            <div class="photo-badges">
              <span class="mono-badge">${badgeLabel}</span>
              <div class="card-actions">
                ${(window.Admin && window.Admin.isAuthenticated()) ? `
                <button class="icon-btn-sm fav-btn ${favClass}" data-id="${photo.id}" title="Favorite">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${photo.favorited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>` : ''}
              </div>
            </div>
            <h3 class="photo-title">${photo.title}</h3>
            <div class="photo-camera-meta">
              <span>${photo.width} × ${photo.height}</span>
              <span>•</span>
              <span>${photo.date || ''}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.container) return;

    const filtered = this.getFilteredPhotos();

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="empty-gallery glass-panel" style="border-radius: var(--radius-md);">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <h3 style="color:#fff; font-size:1.3rem;">No Frames Found</h3>
          <p style="color:var(--text-muted); max-width:400px;">
            ${this.searchQuery ? `No results matching "${this.searchQuery}". Try a different keyword.` : 'No frames in this view.'}
          </p>
          <button class="btn-solid-white" onclick="document.getElementById('upload-modal-backdrop').classList.add('active')">
            Upload Frames Now ↗
          </button>
        </div>
      `;
      window.dispatchEvent(new CustomEvent('galleryUpdated'));
      return;
    }

    const landscapes = filtered.filter(p => p.aspect === 'landscape');
    const portraits = filtered.filter(p => p.aspect === 'portrait');

    let html = '';

    // Section 1: 16:9 Landscape Cinematic Frames (FIRST)
    if (landscapes.length > 0) {
      html += `
        <div class="showcase-block" id="showcase-16-9">
          <div class="showcase-section-header">
            <div class="showcase-header-left">
              <span class="mono-badge-white">16:9 WIDESCREEN</span>
              <h2 class="showcase-title">Cinematic Landscape Frames</h2>
            </div>
            <span class="showcase-counter">${landscapes.length} Frames</span>
          </div>
          <div class="showcase-grid-16-9">
            ${landscapes.map((photo, idx) => this.renderCard(photo, idx)).join('')}
          </div>
        </div>
      `;
    }

    // Section 2: 9:16 Vertical Stills / Motion (SECOND)
    if (portraits.length > 0) {
      html += `
        <div class="showcase-block" id="showcase-9-16">
          <div class="showcase-section-header">
            <div class="showcase-header-left">
              <span class="mono-badge-white">9:16 VERTICAL</span>
              <h2 class="showcase-title">Vertical Motion &amp; Stills</h2>
            </div>
            <span class="showcase-counter">${portraits.length} Stills</span>
          </div>
          <div class="showcase-grid-9-16">
            ${portraits.map((photo, idx) => this.renderCard(photo, idx + landscapes.length)).join('')}
          </div>
        </div>
      `;
    }

    this.container.innerHTML = html;
    this.attachTiltEffects();
    this.attachCardClickHandlers();
    window.dispatchEvent(new CustomEvent('galleryUpdated'));
  }

  attachTiltEffects() {
    const cards = this.container.querySelectorAll('.photo-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }

  attachCardClickHandlers() {
    this.container.querySelectorAll('.photo-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicked favorite button, don't open lightbox
        if (e.target.closest('.fav-btn')) {
          e.stopPropagation();
          const id = e.target.closest('.fav-btn').getAttribute('data-id');
          this.handleToggleFavorite(id);
          return;
        }

        const id = card.getAttribute('data-id');
        const photo = this.photos.find(p => p.id === id);
        if (photo && window.Lightbox) {
          const filtered = this.getFilteredPhotos();
          window.Lightbox.open(photo, filtered);
        }
      });
    });
  }

  async handleToggleFavorite(id) {
    const updated = await window.PortfolioDB.toggleFavorite(id);
    if (updated) {
      const idx = this.photos.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.photos[idx] = updated;
        this.render();
      }
    }
  }
}

window.GalleryController = GalleryController;
