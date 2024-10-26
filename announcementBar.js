// HMStudio Announcement Bar v1.1.2
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

    // Create temporary span to measure text width
    const measureSpan = document.createElement('span');
    measureSpan.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      padding: 0 3rem;
    `;
    measureSpan.textContent = settings.announcementText;
    document.body.appendChild(measureSpan);
    
    // Measure text width
    const textWidth = measureSpan.offsetWidth;
    document.body.removeChild(measureSpan);

    // Calculate number of copies needed based on viewport width
    const viewportWidth = window.innerWidth;
    const copiesNeeded = Math.ceil((viewportWidth * 3) / textWidth) + 2;

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
      transform: translateX(-${textWidth}px);
      animation: hmstudio-scroll ${settings.announcementSpeed}s linear infinite;
    `;

    // Create calculated number of text copies
    for (let i = 0; i < copiesNeeded; i++) {
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
          transform: translateX(-${textWidth}px);
        }
        100% {
          transform: translateX(${textWidth * 2}px);
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

    // Function to handle window resize
    function handleResize() {
      // Recalculate copies needed based on new viewport width
      const newViewportWidth = window.innerWidth;
      const newCopiesNeeded = Math.ceil((newViewportWidth * 3) / textWidth) + 2;

      // Adjust number of copies if needed
      const currentCopies = marqueeInner.children.length;
      if (newCopiesNeeded > currentCopies) {
        for (let i = currentCopies; i < newCopiesNeeded; i++) {
          const textSpan = document.createElement('span');
          textSpan.textContent = settings.announcementText;
          textSpan.style.cssText = `
            display: inline-block;
            padding: 0 3rem;
          `;
          marqueeInner.appendChild(textSpan);
        }
      }

      // Update animation keyframes
      const newStyle = document.createElement('style');
      newStyle.textContent = `
        @keyframes hmstudio-scroll {
          0% {
            transform: translateX(-${textWidth}px);
          }
          100% {
            transform: translateX(${textWidth * 2}px);
          }
        }
      `;
      
      if (style.parentNode) {
        style.parentNode.replaceChild(newStyle, style);
      }

      // Reset animation
      marqueeInner.style.animation = 'none';
      void marqueeInner.offsetWidth; // Force reflow
      marqueeInner.style.animation = `hmstudio-scroll ${settings.announcementSpeed}s linear infinite`;
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Handle font loading
    if (document.fonts) {
      document.fonts.ready.then(handleResize);
    }
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
