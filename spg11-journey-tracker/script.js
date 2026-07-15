/**
 * SPG11 Journey Tracker — Shared Interactive Functionality
 * Manages responsive navigation, cookie banner consent, and form validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCookieConsent();
  initContactForm();
  initThemeToggle();
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
 * Manages the contact form submission, API requests to the Supabase proxy, and live status list.
 */
function initContactForm() {
  const contactForm = document.getElementById('spg11-contact-form');
  const successModal = document.getElementById('contact-success-modal');
  const closeModalBtn = document.getElementById('close-success-modal');

  // Submit flow
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
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

      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitButton ? submitButton.textContent : 'Submit Message Securely';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Registering with Backend...';
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, category, message })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // If message is returned, we explain to the user in a custom notification inside the success modal
          const modalBody = successModal ? successModal.querySelector('p.text-neutral-600') : null;
          if (modalBody && result.message) {
            modalBody.innerHTML = `<strong>Status Notification:</strong> ${result.message}<br/><br/>Your submission has been registered securely on our servers in this sandbox session.`;
          } else if (modalBody) {
            modalBody.textContent = `Thank you for reaching out to the SPG11 Journey advocacy desk. Your correspondence has been registered securely. Our volunteer staff reviews portal submissions twice a week and will reply to your provided electronic mail address if required.`;
          }

          if (successModal) {
            successModal.classList.remove('hidden');
            successModal.classList.add('flex');
          } else {
            alert(`Thank you, ${name}! Your inquiry was registered successfully.`);
          }

          contactForm.reset();
          // Reload the list automatically on successful submission
          loadSubmissions();
        } else {
          alert(`Submission failed: ${result.error || 'Server error occurred'}`);
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('An unexpected error occurred while communicating with the backend API. Please try again.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnText;
        }
      }
    });
  }

  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.add('hidden');
      successModal.classList.remove('flex');
    });
  }

  // Bind refresh button & load submissions on entry
  const refreshBtn = document.getElementById('refresh-submissions-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadSubmissions);
  }

  // Load submissions initially if the list element is present on the page
  if (document.getElementById('submissions-list')) {
    loadSubmissions();
  }
}

/**
 * Fetches recent database logs/submissions from the backend and renders them.
 */
async function loadSubmissions() {
  const loadingDiv = document.getElementById('submissions-loading');
  const errorDiv = document.getElementById('submissions-error');
  const emptyDiv = document.getElementById('submissions-empty');
  const listDiv = document.getElementById('submissions-list');

  if (!loadingDiv || !listDiv) return;

  // Show loading
  loadingDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  emptyDiv.classList.add('hidden');
  listDiv.classList.add('hidden');
  listDiv.innerHTML = '';

  try {
    const response = await fetch('/api/contact');
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || 'Invalid API response format');
    }

    const data = result.data;
    loadingDiv.classList.add('hidden');

    if (data.length === 0) {
      emptyDiv.classList.remove('hidden');
    } else {
      listDiv.classList.remove('hidden');
      
      data.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'py-3.5 flex flex-col gap-1 text-xs border-b border-neutral-100 last:border-0';
        
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now';
        
        // Sanitize helper to prevent XSS in DOM rendering
        const sanitize = (str) => {
          const div = document.createElement('div');
          div.textContent = str;
          return div.innerHTML;
        };

        itemEl.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-black text-sm">${sanitize(item.name)}</span>
            <span class="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono tracking-tight text-[10px] rounded border border-neutral-200">${sanitize(item.category)}</span>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 mt-1 break-words">${sanitize(item.message)}</p>
          <div class="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-1">
            <span>✉️ ${sanitize(item.email)}</span>
            <span>•</span>
            <span>📅 ${sanitize(dateStr)}</span>
          </div>
        `;
        listDiv.appendChild(itemEl);
      });
    }
  } catch (err) {
    console.error('Error loading submissions:', err);
    loadingDiv.classList.add('hidden');
    errorDiv.classList.remove('hidden');
  }
}

/**
 * Handles the theme switching and persistency across pages
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  function updateIcons(isDark) {
    if (isDark) {
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
    } else {
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
    }
  }

  // Initial icon state setup
  const isDark = document.documentElement.classList.contains('dark');
  updateIcons(isDark);

  toggleBtn.addEventListener('click', () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    if (currentlyDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('spg11_theme', 'light');
      updateIcons(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('spg11_theme', 'dark');
      updateIcons(true);
    }
  });
}
