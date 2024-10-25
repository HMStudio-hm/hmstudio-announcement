// HMStudio Announcement Bar v1.0.0
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
      const response = await fetch(`https://your-app-url.com/api/announcement?storeId=${storeId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }
      return await response.json();
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
      position: relative;
      height: 40px;
      display: flex;
      align-items: center;
      z-index: 9999;
    `;

    // Create text container
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      white-space: nowrap;
      animation: hmstudio-slide ${settings.announcementSpeed}s linear infinite;
      padding: 0 50px;
    `;
    textContainer.textContent = settings.announcementText;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-slide {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
    `;
    document.head.appendChild(style);

    // Assemble and insert the bar
    bar.appendChild(textContainer);
    document.body.insertBefore(bar, document.body.firstChild);
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
})();
