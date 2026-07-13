/**
 * SPG11 Journey Tracker — Shared Interactive Functionality
 * Manages responsive navigation, cookie banner consent, and form validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCookieConsent();
  initContactForm();
});

/**
 * Initializes and manages responsive menu highlights and mobile toggles
 */
function initNavigation() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('close-icon');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
        hamburgerIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        hamburgerIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      }
    });
  }

  // Highlight current active navigation item
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";

  // Match links
  const navLinks = document.querySelectorAll('.sleek-nav-link, .nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === "index.html" && href === "./") || (page === "" && href === "index.html")) {
      link.classList.add('sleek-nav-link-active', 'text-orange', 'border-b-2', 'border-orange', 'font-semibold');
      link.classList.remove('text-neutral-600', 'hover:text-black');
    }
  });

  // Mobile nav links
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  mobileNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === "index.html" && href === "./") || (page === "" && href === "index.html")) {
      link.classList.add('bg-neutral-100', 'text-orange', 'font-semibold');
      link.classList.remove('text-neutral-600');
    }
  });
}

/**
 * Manages cookie consent banner states for AdSense policies
 */
function initCookieConsent() {
  const consentBanner = document.getElementById('cookie-consent-banner');
  const acceptBtn = document.getElementById('cookie-accept-btn');

  if (!consentBanner || !acceptBtn) return;

  // Check storage
  const hasConsented = localStorage.getItem('spg11_cookie_consent');
  if (!hasConsented) {
    // Show banner after a slight delay for pleasant entry
    setTimeout(() => {
      consentBanner.classList.remove('translate-y-full');
      consentBanner.classList.add('translate-y-0');
    }, 1000);
  } else {
    consentBanner.remove();
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('spg11_cookie_consent', 'true');
    consentBanner.classList.remove('translate-y-0');
    consentBanner.classList.add('translate-y-full');
    setTimeout(() => {
      consentBanner.remove();
    }, 500);
  });
}

/**
 * Manages the contact form validation and static successful state handling
 */
function initContactForm() {
  const contactForm = document.getElementById('spg11-contact-form');
  const successModal = document.getElementById('contact-success-modal');
  const closeModalBtn = document.getElementById('close-success-modal');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect values
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const category = document.getElementById('contact-category').value;
    const message = document.getElementById('contact-message').value.trim();

    // Basic validation
    if (!name || !email || !message) {
      alert('Please fill out all required fields.');
      return;
    }

    // Since this is static, we mock the submission securely by showing an elegant success state
    console.log('Form submission received:', { name, email, category, message });
    
    // Show modal
    if (successModal) {
      successModal.classList.remove('hidden');
      successModal.classList.add('flex');
    } else {
      alert(`Thank you, ${name}! Your message regarding "${category}" has been registered. We will review it shortly.`);
    }

    // Reset form
    contactForm.reset();
  });

  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.add('hidden');
      successModal.classList.remove('flex');
    });
  }
}
