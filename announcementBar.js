// HMStudio Announcement Bar v1.1.1
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
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;

    // Create inner container for animation
    const marqueeInner = document.createElement('div');
    marqueeInner.className = 'hmstudio-marquee-inner';
    marqueeInner.style.cssText = `
      display: flex;
      height: 100%;
      align-items: center;
      position: absolute;
      white-space: nowrap;
      will-change: transform;
      animation: hmstudio-scroll var(--scroll-time) linear infinite;
      transform: translateX(calc(50% - var(--text-width) / 2));
    `;

    // Create multiple copies of the text for seamless scrolling
    for (let i = 0; i < 6; i++) {
      const textSpan = document.createElement('span');
      textSpan.textContent = settings.announcementText;
      textSpan.style.cssText = `
        display: inline-block;
        padding: 0 3rem;
      `;
      marqueeInner.appendChild(textSpan);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-scroll {
        0% {
          transform: translateX(calc(50% - var(--text-width) / 2));
        }
        100% {
          transform: translateX(calc(-150% - var(--text-width) / 2));
        }
      }
      .hmstudio-marquee-wrapper:hover .hmstudio-marquee-inner {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    // Assemble the components
    marqueeWrapper.appendChild(marqueeInner);
    bar.appendChild(marqueeWrapper);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Calculate text width and adjust animation
    function calculateAndAdjustAnimation() {
      const singleTextWidth = marqueeInner.children[0].offsetWidth;
      const totalWidth = singleTextWidth * 6;
      
      // Set CSS variables for the animation
      marqueeInner.style.setProperty('--text-width', `${singleTextWidth}px`);
      marqueeInner.style.setProperty('--scroll-time', `${settings.announcementSpeed}s`);

      // Reset animation to apply new calculations
      marqueeInner.style.animation = 'none';
      void marqueeInner.offsetWidth; // Force reflow
      marqueeInner.style.animation = `hmstudio-scroll ${settings.announcementSpeed}s linear infinite`;
    }

    // Initial calculation with a slight delay to ensure accurate measurements
    setTimeout(calculateAndAdjustAnimation, 100);

    // Recalculate on resize
    window.addEventListener('resize', calculateAndAdjustAnimation);

    // Handle font loading
    if (document.fonts) {
      document.fonts.ready.then(calculateAndAdjustAnimation);
    }
  }

  // Initialize announcement bar
  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings();
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar({
        ...settings,
        announcementSpeed: Math.max(5, Math.min(60, settings.announcementSpeed)) * 2
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
