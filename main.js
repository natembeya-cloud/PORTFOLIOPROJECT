/* ═══════════════════════════════════════════════════
   PORTFOLIO — Main JavaScript
   Firebase + Animations + Interactions
═══════════════════════════════════════════════════ */

// ── Firebase Init ──────────────────────────────────
let db = null;
let firebaseConnected = false;

function initFirebase(config) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    db = firebase.firestore();

    // Test connection & update badge
    db.collection('_ping').doc('test').set({ ts: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        firebaseConnected = true;
        updateFirebaseBadge(true);
        console.log('✅ Firebase connected');
      })
      .catch(() => updateFirebaseBadge(false));
  } catch (e) {
    console.warn('Firebase init error:', e);
    updateFirebaseBadge(false);
  }
}

function updateFirebaseBadge(connected) {
  document.querySelectorAll('.firebase-dot').forEach(dot => {
    dot.classList.toggle('connected', connected);
  });
  document.querySelectorAll('.firebase-status-text').forEach(el => {
    el.textContent = connected ? 'Firebase Connected' : 'Offline Mode';
  });
}

// ── Save contact message to Firestore ─────────────
async function saveMessageToFirestore(data) {
  if (!db) return;
  try {
    await db.collection('contact_messages').add({
      ...data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false,
    });
    console.log('Message saved to Firestore');
  } catch (e) {
    console.warn('Firestore write failed:', e);
  }
}

// ── Track page views in Firestore ─────────────────
function trackPageView() {
  if (!db) return;
  const page = window.location.pathname;
  db.collection('page_views').add({
    page,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    ua: navigator.userAgent.substring(0, 100),
  }).catch(() => {});
}

// ── Scroll Animations ──────────────────────────────
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}

// ── Skill Bar Animations ───────────────────────────
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.dataset.width;
        entry.target.style.width = target + '%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  bars.forEach(bar => observer.observe(bar));
}

// ── Toast Notification ─────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = type === 'success' ? 'var(--green)' : 'var(--red)';
  toast.style.color = type === 'success' ? 'var(--green)' : 'var(--red)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Contact Form (AJAX) ────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
    btn.disabled = true;

    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data = await res.json();

      if (data.status === 'ok') {
        showToast('✓ ' + data.message);
        form.reset();
        // Also save to Firestore
        saveMessageToFirestore({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message'),
        });
      } else {
        showToast('Please fix the errors below.', 'error');
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// ── Gallery Drop Zone ─────────────────────────────
function initDropZone() {
  const zone = document.getElementById('dropZone');
  if (!zone) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length) handleGalleryUpload(files[0]);
  });
  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => { if (input.files[0]) handleGalleryUpload(input.files[0]); };
    input.click();
  });
}

async function handleGalleryUpload(file) {
  const form = document.getElementById('galleryUploadForm');
  if (!form) return;
  const formData = new FormData(form);
  formData.set('image', file);
  formData.set('title', file.name.replace(/\.[^/.]+$/, ''));

  const zone = document.getElementById('dropZone');
  zone.innerHTML = '<div class="spinner-border text-warning"></div><p class="mt-2">Uploading...</p>';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const data = await res.json();
    if (data.status === 'ok') {
      showToast('✓ Image uploaded successfully!');
      location.reload();
    } else {
      showToast('Upload failed.', 'error');
    }
  } catch {
    showToast('Upload error.', 'error');
  }
}

// ── Navbar active link ────────────────────────────
function initNavActive() {
  const links = document.querySelectorAll('.nav-link');
  const path = window.location.pathname;
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      link.classList.add('active');
    }
  });
}

// ── Typing animation ──────────────────────────────
function initTyping() {
  const el = document.getElementById('typingTitle');
  if (!el) return;
  const titles = el.dataset.titles ? JSON.parse(el.dataset.titles) : [];
  if (!titles.length) return;
  let i = 0, j = 0, deleting = false;
  function type() {
    const current = titles[i];
    el.textContent = current.substring(0, j);
    if (!deleting && j < current.length) { j++; setTimeout(type, 80); }
    else if (!deleting && j === current.length) { deleting = true; setTimeout(type, 1800); }
    else if (deleting && j > 0) { j--; setTimeout(type, 40); }
    else { deleting = false; i = (i + 1) % titles.length; setTimeout(type, 300); }
  }
  type();
}

// ── Gallery Lightbox ──────────────────────────────
function initLightbox() {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;
      const modal = document.createElement('div');
      modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:2rem;`;
      modal.innerHTML = `<img src="${img.src}" style="max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;">`;
      modal.addEventListener('click', () => modal.remove());
      document.body.appendChild(modal);
    });
  });
}

// ── Boot ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initSkillBars();
  initContactForm();
  initDropZone();
  initNavActive();
  initTyping();
  initLightbox();
  trackPageView();

  // Firebase config passed from Django template
  if (window.FIREBASE_CONFIG) {
    try {
      const cfg = JSON.parse(window.FIREBASE_CONFIG);
      if (cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY') {
        initFirebase(cfg);
      }
    } catch (e) {
      console.warn('Firebase config parse error', e);
    }
  }
});
