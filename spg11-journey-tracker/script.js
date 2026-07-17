/**
 * SPG11 Journey Tracker — Shared Interactive Functionality
 * Manages responsive navigation, cookie banner consent, and form validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCookieConsent();
  initContactForm();
  initThemeToggle();
  initScrollToTop();
  initScrollProgressBar();
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

/**
 * Adds and manages a floating "Scroll to Top" button that appears when scrolling past the hero section (or >300px).
 */
function initScrollToTop() {
  // Create the floating action button
  const button = document.createElement('button');
  button.id = 'scroll-to-top';
  button.setAttribute('aria-label', 'Scroll to top');
  
  // Design system alignment: custom spacing, shadow-lg, high contrast transition colors matching theme toggle Focus states
  button.className = 'fixed bottom-6 right-6 z-50 p-3 rounded-full bg-orange text-white shadow-lg shadow-orange/20 cursor-pointer translate-y-16 opacity-0 pointer-events-none transition-all duration-300 hover:scale-110 hover:bg-orange/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange/50';
  
  // Premium vector arrow indicator
  button.innerHTML = `
    <svg class="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  `;
  
  document.body.appendChild(button);
  
  // Smooth scroll handler
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  const heroElement = document.getElementById('hero');
  
  const handleScroll = () => {
    const scrollPos = window.scrollY || window.pageYOffset;
    let threshold = 300;
    
    // Dynamically calculate threshold based on hero section size if present
    if (heroElement) {
      threshold = heroElement.offsetTop + heroElement.offsetHeight - 80;
    }
    
    if (scrollPos > threshold) {
      button.classList.remove('translate-y-16', 'opacity-0', 'pointer-events-none');
      button.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    } else {
      button.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      button.classList.add('translate-y-16', 'opacity-0', 'pointer-events-none');
    }
  };
  
  // Event listener with passive performance flag
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Adds and manages a visual scroll-progress bar at the very top of the viewport to help users track progress through long-form pages.
 */
function initScrollProgressBar() {
  // Create progress bar container
  const container = document.createElement('div');
  container.id = 'scroll-progress-container';
  container.setAttribute('aria-hidden', 'true');
  
  // Custom styling: fixed position, top-0, z-50 (above sticky headers), custom transition
  container.className = 'fixed top-0 left-0 w-full h-[3px] bg-neutral-100/30 dark:bg-neutral-800/20 z-[100] pointer-events-none';
  
  // Create progress bar fill
  const fill = document.createElement('div');
  fill.id = 'scroll-progress-bar';
  
  // Sleek thematic gradient from brand orange to green, blending rare disease visual identity
  fill.className = 'h-full bg-gradient-to-r from-orange via-orange to-green w-0 transition-all duration-75 ease-out rounded-r-full';
  
  container.appendChild(fill);
  document.body.appendChild(container);
  
  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    if (scrollHeight > 0) {
      const percentage = (scrollTop / scrollHeight) * 100;
      fill.style.width = `${percentage}%`;
    } else {
      fill.style.width = '0%';
    }
  };
  
  // Track scroll and window resize events
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
}
