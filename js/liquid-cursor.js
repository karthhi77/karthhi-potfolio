/**
 * Liquid Cursor
 * Viscous magnetic fluid cursor with velocity-based squish and element snapping
 */

class LiquidCursor {
  constructor() {
    this.cursor = document.getElementById('liquid-cursor');
    this.follower = document.getElementById('liquid-cursor-follower');
    if (!this.cursor || !this.follower) return;

    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.followerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.vel = { x: 0, y: 0 };

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.addEventListener('pointermove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });

    // Add hover effects for interactive elements
    const setupHoverListeners = () => {
      const interactives = document.querySelectorAll('button, a, .photo-card, .dropzone, input, select, .glass-btn, .tab-btn');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });
    };

    setupHoverListeners();
    // Re-check when gallery re-renders
    window.addEventListener('galleryUpdated', setupHoverListeners);

    window.addEventListener('dragenter', () => document.body.classList.add('cursor-drag'));
    window.addEventListener('dragleave', (e) => {
      if (e.clientX === 0 || e.clientY === 0) document.body.classList.remove('cursor-drag');
    });
    window.addEventListener('drop', () => document.body.classList.remove('cursor-drag'));
  }

  render() {
    // Interpolate main dot
    this.pos.x += (this.target.x - this.pos.x) * 0.55;
    this.pos.y += (this.target.y - this.pos.y) * 0.55;

    // Follower viscous lag
    const dx = this.target.x - this.followerPos.x;
    const dy = this.target.y - this.followerPos.y;
    this.vel.x = dx;
    this.vel.y = dy;

    this.followerPos.x += dx * 0.16;
    this.followerPos.y += dy * 0.16;

    // Speed deformation (squish)
    const speed = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const stretch = Math.min(speed * 0.003, 0.45);
    const scaleX = 1 + stretch;
    const scaleY = 1 - stretch;

    this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    this.follower.style.transform = `translate3d(${this.followerPos.x}px, ${this.followerPos.y}px, 0) rotate(${angle}rad) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(() => this.render());
  }
}

window.LiquidCursor = LiquidCursor;
