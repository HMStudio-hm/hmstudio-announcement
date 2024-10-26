// HMStudio Announcement Bar v1.1.6
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

    // Create two inner containers for seamless animation
    const marqueeTrack = document.createElement('div');
    marqueeTrack.className = 'hmstudio-marquee-track';
    marqueeTrack.style.cssText = `
      display: flex;
      height: 100%;
      width: max-content;
      position: relative;
    `;

    // Create two separate containers for continuous movement
    for (let i = 0; i < 2; i++) {
      const marqueeContent = document.createElement('div');
      marqueeContent.className = 'hmstudio-marquee-content';
      marqueeContent.style.cssText = `
        display: flex;
        height: 100%;
        align-items: center;
        animation: hmstudio-scroll ${settings.announcementSpeed}s linear infinite;
        animation-delay: ${i * (settings.announcementSpeed / 2)}s;
      `;

      // Calculate number of copies needed based on viewport width
      const viewportWidth = window.innerWidth;
      const copiesNeeded = Math.ceil(viewportWidth / 100) + 2; // Adjust divisor as needed

      // Add text copies to each container
      for (let j = 0; j < copiesNeeded; j++) {
        const textSpan = document.createElement('span');
        textSpan.textContent = settings.announcementText;
        textSpan.style.cssText = `
          display: inline-block;
          padding: 0 3rem;
        `;
        marqueeContent.appendChild(textSpan);
      }

      marqueeTrack.appendChild(marqueeContent);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hmstudio-scroll {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      .hmstudio-marquee-wrapper:hover .hmstudio-marquee-content {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    // Assemble the components
    marqueeWrapper.appendChild(marqueeTrack);
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
      const viewportWidth = window.innerWidth;
      const copiesNeeded = Math.ceil(viewportWidth / 100) + 2;

      // Update copies for each container
      document.querySelectorAll('.hmstudio-marquee-content').forEach(container => {
        // Add more copies if needed
        while (container.children.length < copiesNeeded) {
          const textSpan = document.createElement('span');
          textSpan.textContent = settings.announcementText;
          textSpan.style.cssText = `
            display: inline-block;
            padding: 0 3rem;
          `;
          container.appendChild(textSpan);
        }
      });

      // Reset animations
      document.querySelectorAll('.hmstudio-marquee-content').forEach((content, i) => {
        content.style.animation = 'none';
        void content.offsetWidth;
        content.style.animation = `hmstudio-scroll ${settings.announcementSpeed}s linear infinite`;
        content.style.animationDelay = `${i * (settings.announcementSpeed / 2)}s`;
      });
    }

    // Initial setup
    setTimeout(handleResize, 100);

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
