/**
 * Fullscreen Liquid Glass Lightbox
 * High-definition viewer, EXIF data inspection, slideshow, keyboard navigation, download & delete
 */

class Lightbox {
  constructor(galleryController) {
    this.gallery = galleryController;
    this.backdrop = document.getElementById('lightbox-backdrop');
    this.imgEl = document.getElementById('lightbox-img');
    this.titleEl = document.getElementById('lightbox-title');
    this.categoryEl = document.getElementById('lightbox-category');
    this.dimensionsEl = document.getElementById('lightbox-dimensions');
    this.exifDateEl = document.getElementById('lightbox-date');
    this.counterEl = document.getElementById('lightbox-counter');

    this.prevBtn = document.getElementById('lightbox-prev');
    this.nextBtn = document.getElementById('lightbox-next');
    this.closeBtn = document.getElementById('lightbox-close');
    this.downloadBtn = document.getElementById('lightbox-download');
    this.deleteBtn = document.getElementById('lightbox-delete');
    this.slideshowBtn = document.getElementById('lightbox-slideshow');
    this.favBtn = document.getElementById('lightbox-fav');

    this.currentList = [];
    this.currentIndex = 0;
    this.slideshowInterval = null;

    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop || e.target.classList.contains('lightbox-main-view')) {
          this.close();
        }
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (!this.backdrop.classList.contains('active')) return;

      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowLeft') this.prev();
      else if (e.key === 'ArrowRight') this.next();
      else if (e.key === ' ') {
        e.preventDefault();
        this.toggleSlideshow();
      }
    });

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadCurrent());
    }

    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', () => this.deleteCurrent());
    }

    if (this.slideshowBtn) {
      this.slideshowBtn.addEventListener('click', () => this.toggleSlideshow());
    }

    if (this.favBtn) {
      this.favBtn.addEventListener('click', () => this.toggleFavorite());
    }
  }

  open(photo, list) {
    this.currentList = list && list.length > 0 ? list : [photo];
    this.currentIndex = this.currentList.findIndex(p => p.id === photo.id);
    if (this.currentIndex === -1) this.currentIndex = 0;

    this.backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.updateView();
  }

  close() {
    this.backdrop.classList.remove('active');
    document.body.style.overflow = '';
    this.stopSlideshow();
  }

  next() {
    if (this.currentList.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.currentList.length;
    this.updateView();
  }

  prev() {
    if (this.currentList.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.currentList.length) % this.currentList.length;
    this.updateView();
  }

  updateView() {
    const photo = this.currentList[this.currentIndex];
    if (!photo) return;

    // Fade animation
    this.imgEl.style.opacity = '0';
    this.imgEl.style.transform = 'scale(0.96)';

    setTimeout(() => {
      this.imgEl.src = photo.url;
      this.imgEl.alt = photo.title;
      this.imgEl.style.opacity = '1';
      this.imgEl.style.transform = 'scale(1)';
    }, 150);

    if (this.titleEl) this.titleEl.textContent = photo.title;
    if (this.categoryEl) this.categoryEl.textContent = photo.category || 'Photography';
    if (this.dimensionsEl) this.dimensionsEl.textContent = photo.width && photo.height ? `${photo.width} × ${photo.height}px` : '';
    if (this.exifDateEl) this.exifDateEl.textContent = photo.date || '';

    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentIndex + 1} / ${this.currentList.length}`;
    }

    // Admin-only controls: Only visible if authenticated with password
    const adminActionsContainer = document.getElementById('lightbox-admin-actions');
    const isAuth = window.Admin && window.Admin.isAuthenticated();
    if (adminActionsContainer) {
      adminActionsContainer.style.display = isAuth ? 'inline-flex' : 'none';
    }

    if (this.favBtn) {
      this.favBtn.style.color = photo.favorited ? '#f355da' : '#ffffff';
    }
  }

  async toggleFavorite() {
    const photo = this.currentList[this.currentIndex];
    if (!photo) return;

    await this.gallery.handleToggleFavorite(photo.id);
    photo.favorited = !photo.favorited;
    this.updateView();
  }

  downloadCurrent() {
    const photo = this.currentList[this.currentIndex];
    if (!photo) return;

    const link = document.createElement('a');
    link.href = photo.url;
    link.download = (photo.title || 'photo').replace(/\s+/g, '_') + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast('📥 Photo downloaded successfully!');
  }

  async deleteCurrent() {
    const photo = this.currentList[this.currentIndex];
    if (!photo) return;

    if (!confirm(`Are you sure you want to remove "${photo.title}" from your portfolio?`)) {
      return;
    }

    await window.PortfolioDB.deletePhoto(photo.id);

    // Remove from gallery and list
    const galleryIdx = this.gallery.photos.findIndex(p => p.id === photo.id);
    if (galleryIdx !== -1) {
      this.gallery.photos.splice(galleryIdx, 1);
    }

    this.currentList.splice(this.currentIndex, 1);

    if (this.currentList.length === 0) {
      this.close();
    } else {
      if (this.currentIndex >= this.currentList.length) {
        this.currentIndex = 0;
      }
      this.updateView();
    }

    this.gallery.updateStats();
    this.gallery.render();
    window.showToast('🗑️ Photo removed from portfolio');
  }

  toggleSlideshow() {
    if (this.slideshowInterval) {
      this.stopSlideshow();
      window.showToast('⏸ Slideshow paused');
    } else {
      this.startSlideshow();
      window.showToast('▶ Slideshow started');
    }
  }

  startSlideshow() {
    if (this.slideshowBtn) {
      this.slideshowBtn.classList.add('primary');
    }
    this.slideshowInterval = setInterval(() => {
      this.next();
    }, 4000);
  }

  stopSlideshow() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }
    if (this.slideshowBtn) {
      this.slideshowBtn.classList.remove('primary');
    }
  }
}

window.Lightbox = null;
