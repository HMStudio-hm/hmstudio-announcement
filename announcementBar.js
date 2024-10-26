// HMStudio Announcement Bar v1.2.0
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
      left: 0;
    `;

    // Create initial text elements
    const textSpan = document.createElement('span');
    textSpan.textContent = settings.announcementText;
    textSpan.style.cssText = `
      display: inline-block;
      padding: 0 3rem;
    `;
    tickerContent.appendChild(textSpan);

    // Add content to bar for measurement
    bar.appendChild(tickerContent);
    document.body.appendChild(bar);

    // Measure text and viewport
    const textWidth = textSpan.offsetWidth;
    const viewportWidth = window.innerWidth;
    const copiesNeeded = Math.ceil((viewportWidth * 3) / textWidth) + 2; // Increased copies for smoother scroll

    // Add necessary copies
    for (let i = 1; i < copiesNeeded; i++) {
      const clone = textSpan.cloneNode(true);
      tickerContent.appendChild(clone);
    }

    // Animation variables
    let animationId;
    let position = 0;
    let isPaused = false;
    const speed = (70 - settings.announcementSpeed) * 0.5; // Adjust speed based on settings

    function animate() {
      if (!isPaused) {
        position += speed;
        
        // Calculate the point where text should reset
        // This should be when the first text element has moved completely off screen
        const resetPoint = textWidth;
        
        if (position >= resetPoint) {
          // Reset to create endless scroll effect
          position = 0;
          
          // Optionally move the first text element to the end for smoother transition
          const firstText = tickerContent.children[0];
          tickerContent.appendChild(firstText.cloneNode(true));
          tickerContent.removeChild(firstText);
        }

        tickerContent.style.transform = `translateX(${position}px)`;
      }
      animationId = requestAnimationFrame(animate);
    }

    // Start animation with a slight delay to ensure proper initialization
    setTimeout(() => {
      // Set initial position to ensure text starts from left
      position = 0;
      tickerContent.style.transform = `translateX(${position}px)`;
      animate();
    }, 100);

    // Add hover pause functionality
    bar.addEventListener('mouseenter', () => {
      isPaused = true;
    });

    bar.addEventListener('mouseleave', () => {
      isPaused = false;
    });

    // Handle cleanup
    function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }

    // Move bar to final position
    const targetLocation = document.querySelector('.header');
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild);
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      isPaused = document.hidden;
      if (!document.hidden) {
        // Reset position when becoming visible again
        position = 0;
        tickerContent.style.transform = `translateX(${position}px)`;
      }
    });

    // Cleanup on page unload
    window.addEventListener('unload', cleanup);

    // Observe bar removal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === bar) {
            cleanup();
            observer.disconnect();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      const newViewportWidth = window.innerWidth;
      const newCopiesNeeded = Math.ceil((newViewportWidth * 3) / textWidth) + 2;

      // Add more copies if needed
      while (tickerContent.children.length < newCopiesNeeded) {
        const clone = textSpan.cloneNode(true);
        tickerContent.appendChild(clone);
      }

      // Reset position to maintain smooth scroll
      position = 0;
      tickerContent.style.transform = `translateX(${position}px)`;
    });
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
