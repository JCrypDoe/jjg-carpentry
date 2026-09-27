/* ============================================================
   JJG Carpentry LLC — Main JavaScript
   ============================================================ */

// ── Navbar scroll effect ──
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ── Mobile nav toggle ──
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  const setMenuState = (isOpen) => {
    navLinks.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    const spans = navToggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  };

  navToggle.addEventListener('click', () => {
    setMenuState(!navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuState(false));
  });
}

// ── Active nav link ──
(function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '/' && href === '/') ||
        (path !== '/' && href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });
})();

// ── Intersection Observer animations ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery-card, .process-step, .feature-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── Toast notification ──
function showToast(message, type = 'info') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Counter animation ──
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start) + (el.dataset.suffix || '');
  }, 16);
}

// Trigger counters when visible
document.querySelectorAll('[data-counter]').forEach(el => {
  const counterObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounter(el, parseInt(el.dataset.counter));
      counterObs.unobserve(el);
    }
  });
  counterObs.observe(el);
});

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Form validation helper ──
function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#dc3545';
      valid = false;
    } else {
      field.style.borderColor = '';
    }
  });
  return valid;
}

// ── Contact form submission ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(contactForm)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const btn = contactForm.querySelector('[type="submit"]');
    btn.innerHTML = '<span class="spinner"></span> Sending...';
    btn.disabled = true;
    // Simulate send (replace with real endpoint)
    await new Promise(r => setTimeout(r, 1500));
    showToast('Message sent! We\'ll be in touch soon.', 'success');
    contactForm.reset();
    btn.innerHTML = 'Send Message';
    btn.disabled = false;
  });
}

// ── Quote form submission ──
const quoteForm = document.getElementById('quoteForm');
if (quoteForm) {
  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(quoteForm)) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const btn = quoteForm.querySelector('[type="submit"]');
    btn.innerHTML = '<span class="spinner"></span> Submitting...';
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1500));
    showToast('Quote request submitted! We\'ll contact you within 24 hours.', 'success');
    quoteForm.reset();
    btn.innerHTML = 'Request Free Quote';
    btn.disabled = false;
  });
}

// ── Expose globals ──
window.JJG = { showToast, validateForm };