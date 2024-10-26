// HMStudio Announcement Bar v1.0.3
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

    // Create inner container for smooth animation
    const innerContainer = document.createElement('div');
    innerContainer.style.cssText = `
      display: flex;
      align-items: center;
      position: relative;
      white-space: nowrap;
      will-change: transform;
      animation: hmstudio-scroll ${settings.announcementSpeed}s linear infinite;
    `;

    // Calculate how many times to repeat the text
    const textLength = settings.announcementText.length;
    const repeatCount = Math.ceil(window.innerWidth / (textLength * 8)) + 2; // Adjust multiplier as needed

    // Create multiple text spans for seamless loop
    for (let i = 0; i < repeatCount; i++) {
      const textSpan = document.createElement('span');
      textSpan.textContent = settings.announcementText;
      textSpan.style.cssText = `
        padding: 0 20px;
        display: inline-block;
      `;
      innerContainer.appendChild(textSpan);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-scroll {
        0% { transform: translate3d(-50%, 0, 0); }
        100% { transform: translate3d(0%, 0, 0); }
      }
    `;
    document.head.appendChild(style);

    // Assemble and insert the bar
    bar.appendChild(innerContainer);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Function to handle resize
    function handleResize() {
      // Update the number of text copies based on new window width
      const newRepeatCount = Math.ceil(window.innerWidth / (textLength * 8)) + 2;
      
      // Only update if we need more copies
      if (newRepeatCount > innerContainer.children.length) {
        while (innerContainer.children.length < newRepeatCount) {
          const textSpan = document.createElement('span');
          textSpan.textContent = settings.announcementText;
          textSpan.style.cssText = `
            padding: 0 20px;
            display: inline-block;
          `;
          innerContainer.appendChild(textSpan);
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
      // Convert speed from range 5-60 to actual animation duration
      settings.announcementSpeed = Math.max(5, Math.min(60, settings.announcementSpeed));
      createAnnouncementBar(settings);
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
