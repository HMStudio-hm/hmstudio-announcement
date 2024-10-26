// HMStudio Announcement Bar v1.0.5
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
      display: flex;
      align-items: center;
      position: relative;
      z-index: 999999;
    `;

    // Create ticker container
    const tickerContainer = document.createElement('div');
    tickerContainer.className = 'hmstudio-ticker-container';
    tickerContainer.style.cssText = `
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    `;

    // Create ticker content
    const ticker = document.createElement('div');
    ticker.className = 'hmstudio-ticker';
    ticker.style.cssText = `
      display: flex;
      align-items: center;
      white-space: nowrap;
      will-change: transform;
      position: absolute;
      left: 0;
      animation: hmstudio-ticker ${settings.announcementSpeed}s linear infinite;
      padding-left: 100%;
    `;

    // Calculate how many copies we need
    const textLength = settings.announcementText.length;
    const repeatCount = Math.ceil((window.innerWidth * 2) / (textLength * 8)) + 2;

    // Add text copies to ensure smooth scrolling
    for (let i = 0; i < repeatCount; i++) {
      const textSpan = document.createElement('span');
      textSpan.textContent = settings.announcementText;
      textSpan.style.cssText = `
        padding: 0 20px;
        display: inline-block;
      `;
      ticker.appendChild(textSpan);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-ticker {
        0% {
          transform: translate3d(0, 0, 0);
        }
        100% {
          transform: translate3d(-100%, 0, 0);
        }
      }
      .hmstudio-ticker-container:hover .hmstudio-ticker {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    // Assemble the components
    tickerContainer.appendChild(ticker);
    bar.appendChild(tickerContainer);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Function to handle resize and update text copies if needed
    function handleResize() {
      const newRepeatCount = Math.ceil((window.innerWidth * 2) / (textLength * 8)) + 2;
      if (newRepeatCount > ticker.children.length) {
        // Add more text copies if needed
        for (let i = ticker.children.length; i < newRepeatCount; i++) {
          const textSpan = document.createElement('span');
          textSpan.textContent = settings.announcementText;
          textSpan.style.cssText = `
            padding: 0 20px;
            display: inline-block;
          `;
          ticker.appendChild(textSpan);
        }
      }
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);
  }

  // Initialize announcement bar
  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings();
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar({
        ...settings,
        // Convert the speed to be more appropriate for the new animation style
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
