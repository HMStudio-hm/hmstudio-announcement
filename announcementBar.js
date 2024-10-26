// HMStudio Announcement Bar v1.1.5
// Created by HMStudio
// https://github.com/your-username/hmstudio-announcement

(function() {
  console.log('Announcement Bar script initialized');

  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript;
    const scriptUrl = new URL(scriptTag.src);
    const storeId = scriptUrl.searchParams.get('storeId');
    return storeId ? storeId.split('?')[0] : null;
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || 'ar';
  }

  const storeId = getStoreIdFromUrl();
  if (!storeId) {
    console.error('Store ID not found in script URL');
    return;
  }

  async function fetchAnnouncementSettings() {
    try {
      const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getAnnouncementSettings?storeId=${storeId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched announcement settings:', data);
      return data;
    } catch (error) {
      console.error('Error fetching announcement settings:', error);
      return null;
    }
  }

  function createAnnouncementBar(settings) {
    // Remove existing announcement bar if any
    const existingBar = document.getElementById('hmstudio-announcement-bar');
    if (existingBar) {
      existingBar.remove();
    }

    // Create bar container
    const bar = document.createElement('div');
    bar.id = 'hmstudio-announcement-bar';
    bar.style.cssText = `
      width: 100%;
      background-color: ${settings.announcementBackgroundColor};
      color: ${settings.announcementTextColor};
      overflow: hidden;
      height: 40px;
      position: relative;
      z-index: 999999;
    `;

    // Create marquee wrapper
    const marqueeWrapper = document.createElement('div');
    marqueeWrapper.className = 'hmstudio-marquee-wrapper';
    marqueeWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    `;

    // Create two inner containers for seamless animation
    const createInnerContainer = () => {
      const container = document.createElement('div');
      container.className = 'hmstudio-marquee-content';
      container.style.cssText = `
        height: 100%;
        display: flex;
        align-items: center;
        position: absolute;
        left: 0;
        top: 0;
        white-space: nowrap;
        will-change: transform;
      `;
      
      // Add text span
      const textSpan = document.createElement('span');
      textSpan.textContent = settings.announcementText;
      textSpan.style.cssText = `
        display: inline-block;
        padding: 0 3rem;
      `;
      container.appendChild(textSpan);
      
      return container;
    };

    // Create primary and clone containers
    const primaryContainer = createInnerContainer();
    const cloneContainer = createInnerContainer();

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-ticker {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      .hmstudio-marquee-wrapper:hover .hmstudio-marquee-content {
        animation-play-state: paused !important;
      }
    `;
    document.head.appendChild(style);

    // Function to start animations
    function startAnimation() {
      const distance = primaryContainer.offsetWidth;
      const duration = settings.announcementSpeed;
      const gap = distance / 2; // Gap between texts

      primaryContainer.style.animation = `hmstudio-ticker ${duration}s linear infinite`;
      cloneContainer.style.animation = `hmstudio-ticker ${duration}s linear infinite`;
      
      // Position and animate containers
      const setInitialPositions = () => {
        // Calculate positions to ensure smooth transition
        const startPos = -distance;
        primaryContainer.style.transform = `translateX(${startPos}px)`;
        cloneContainer.style.transform = `translateX(${startPos + gap}px)`;
        
        // Start animations with a slight delay between them
        primaryContainer.style.animation = `hmstudio-ticker ${duration}s linear infinite`;
        cloneContainer.style.animation = `hmstudio-ticker ${duration}s linear infinite`;
        cloneContainer.style.animationDelay = `${duration / 2}s`;
      };

      setInitialPositions();
    }

    // Assemble the components
    marqueeWrapper.appendChild(primaryContainer);
    marqueeWrapper.appendChild(cloneContainer);
    bar.appendChild(marqueeWrapper);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Start animation after a brief delay to ensure rendering
    setTimeout(startAnimation, 100);

    // Handle resize
    window.addEventListener('resize', () => {
      startAnimation();
    });

    // Handle font loading
    if (document.fonts) {
      document.fonts.ready.then(() => {
        startAnimation();
      });
    }
  }

  // Initialize announcement bar
  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings();
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar({
        ...settings,
        announcementSpeed: Math.max(5, Math.min(60, settings.announcementSpeed)) * 1.5
      });
    }
  }

  // Run initialization
  initializeAnnouncementBar();

  // Optional: Re-initialize on dynamic content changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && !document.getElementById('hmstudio-announcement-bar')) {
        initializeAnnouncementBar();
        break;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
