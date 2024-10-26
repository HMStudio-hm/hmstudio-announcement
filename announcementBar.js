// HMStudio Announcement Bar v1.0.4
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

    // Create scrolling container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'announcement-scroll-container';
    scrollContainer.style.cssText = `
      display: flex;
      position: relative;
      white-space: nowrap;
      will-change: transform;
    `;

    // Create primary content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'announcement-content';
    contentContainer.style.cssText = `
      display: flex;
      animation: scrollLeft ${settings.announcementSpeed}s linear infinite;
      padding-left: 100%;
    `;

    // Add text with proper spacing
    const textSpan = document.createElement('span');
    textSpan.style.cssText = `
      white-space: nowrap;
      padding: 0 50px;
    `;
    textSpan.textContent = settings.announcementText;

    // Create duplicate for seamless loop
    const textSpan2 = textSpan.cloneNode(true);

    // Add text elements to content container
    contentContainer.appendChild(textSpan);
    contentContainer.appendChild(textSpan2);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scrollLeft {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-100%);
        }
      }
      
      .announcement-content {
        -webkit-font-smoothing: antialiased;
      }
    `;
    document.head.appendChild(style);

    // Assemble the components
    scrollContainer.appendChild(contentContainer);
    bar.appendChild(scrollContainer);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Function to handle visibility changes
    function handleVisibilityChange() {
      const content = document.querySelector('.announcement-content');
      if (content) {
        if (document.hidden) {
          content.style.animationPlayState = 'paused';
        } else {
          content.style.animationPlayState = 'running';
        }
      }
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Pause animation when not in viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const content = entry.target.querySelector('.announcement-content');
        if (content) {
          content.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        }
      });
    });

    observer.observe(bar);
  }

  // Initialize announcement bar
  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings();
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar(settings);
    }
  }

  // Run initialization
  initializeAnnouncementBar();

  // Re-initialize on dynamic content changes
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
