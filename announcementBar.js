// HMStudio Announcement Bar v1.2.1
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

    // Create content container
    const tickerContent = document.createElement('div');
    tickerContent.id = 'tickerContent';
    tickerContent.style.cssText = `
      position: absolute;
      white-space: nowrap;
      height: 100%;
      display: flex;
      align-items: center;
      will-change: transform;
    `;

    // Calculate number of copies needed (initial)
    const tempSpan = document.createElement('span');
    tempSpan.textContent = settings.announcementText;
    tempSpan.style.cssText = `
      display: inline-block;
      padding: 0 3rem;
      visibility: hidden;
      position: absolute;
    `;
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    // Create enough copies to fill twice the viewport width
    const viewportWidth = window.innerWidth;
    const copiesNeeded = Math.ceil((viewportWidth * 3) / textWidth) + 2;

    for (let i = 0; i < copiesNeeded; i++) {
      const textSpan = document.createElement('span');
      textSpan.textContent = settings.announcementText;
      textSpan.style.cssText = `
        display: inline-block;
        padding: 0 3rem;
      `;
      tickerContent.appendChild(textSpan);
    }

    // Add content to bar
    bar.appendChild(tickerContent);

    // Insert at the top of the page
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    // Animation variables
    let currentPosition = 0;
    let lastTimestamp = 0;
    const pixelsPerSecond = (70 - settings.announcementSpeed) * 20; // Adjust speed
    let animationId;
    let isPaused = false;

    function updateAnimation(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!isPaused) {
        // Calculate movement based on time
        const movement = (pixelsPerSecond * deltaTime) / 1000;
        currentPosition += movement;

        // Reset position when necessary
        if (currentPosition >= textWidth) {
          currentPosition = 0;
          // Move first item to end for smooth transition
          const firstItem = tickerContent.children[0];
          tickerContent.appendChild(firstItem.cloneNode(true));
          tickerContent.removeChild(firstItem);
        }

        tickerContent.style.transform = `translateX(${currentPosition}px)`;
      }

      animationId = requestAnimationFrame(updateAnimation);
    }

    // Start animation
    animationId = requestAnimationFrame(updateAnimation);

    // Add hover pause functionality
    bar.addEventListener('mouseenter', () => {
      isPaused = true;
    });

    bar.addEventListener('mouseleave', () => {
      isPaused = false;
      lastTimestamp = 0; // Reset timestamp for smooth resume
    });

    // Handle cleanup
    function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
        lastTimestamp = 0; // Reset timestamp for smooth resume
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      const newViewportWidth = window.innerWidth;
      const newCopiesNeeded = Math.ceil((newViewportWidth * 3) / textWidth) + 2;

      // Adjust number of copies if needed
      while (tickerContent.children.length < newCopiesNeeded) {
        const clone = tickerContent.children[0].cloneNode(true);
        tickerContent.appendChild(clone);
      }
    });

    // Cleanup on page unload
    window.addEventListener('unload', cleanup);
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
