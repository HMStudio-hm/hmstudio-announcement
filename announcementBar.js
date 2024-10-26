// HMStudio Announcement Bar v1.0.8
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
      left: 0;
      top: 0;
      white-space: nowrap;
      will-change: transform;
      animation: hmstudio-scroll ${settings.announcementSpeed}s linear infinite;
    `;

    // Create two spans to ensure continuous flow
    const textSpan1 = document.createElement('span');
    textSpan1.textContent = settings.announcementText;
    textSpan1.style.cssText = `
      display: inline-block;
      padding: 0 2rem;
    `;

    const textSpan2 = document.createElement('span');
    textSpan2.textContent = settings.announcementText;
    textSpan2.style.cssText = `
      display: inline-block;
      padding: 0 2rem;
    `;

    marqueeInner.appendChild(textSpan1);
    marqueeInner.appendChild(textSpan2);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-scroll {
        from {
          transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(${-50}%, 0, 0);
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
      const textWidth = textSpan1.offsetWidth;
      const windowWidth = window.innerWidth;
      const totalDistance = textWidth * 2; // Distance to move is 2x text width

      // Recreate animation with calculated values
      const newStyle = document.createElement('style');
      newStyle.textContent = `
        @keyframes hmstudio-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `;
      
      // Replace old style with new one
      if (style.parentNode) {
        style.parentNode.replaceChild(newStyle, style);
      }
    }

    // Initial calculation
    setTimeout(calculateAndAdjustAnimation, 100);

    // Recalculate on resize
    window.addEventListener('resize', calculateAndAdjustAnimation);
  }

  // Initialize announcement bar
  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings();
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar({
        ...settings,
        announcementSpeed: Math.max(5, Math.min(60, settings.announcementSpeed))
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
