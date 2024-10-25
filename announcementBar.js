// HMStudio Announcement Bar v1.0.2
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
        // Update the URL to use your Firebase function URL
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
  
      // Create text container for animation
      const textContainer = document.createElement('div');
      textContainer.style.cssText = `
        white-space: nowrap;
        position: absolute;
        display: flex;
        will-change: transform;
        animation: hmstudio-ticker ${settings.announcementSpeed}s linear infinite;
        padding: 0 50px;
      `;
  
      // Create two spans for seamless looping
      const span1 = document.createElement('span');
      span1.textContent = settings.announcementText;
      span1.style.padding = '0 20px';
      
      const span2 = document.createElement('span');
      span2.textContent = settings.announcementText;
      span2.style.padding = '0 20px';
      
      textContainer.appendChild(span1);
      textContainer.appendChild(span2);
  
      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes hmstudio-ticker {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
      `;
      document.head.appendChild(style);
  
      // Assemble and insert the bar
      bar.appendChild(textContainer);
  
      // Insert at the top of the page
      const targetLocation = document.querySelector('.header');
      if (targetLocation) {
        targetLocation.insertBefore(bar, targetLocation.firstChild);
      } else {
        document.body.insertBefore(bar, document.body.firstChild);
      }
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
