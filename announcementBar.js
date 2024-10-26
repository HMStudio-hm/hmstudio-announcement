// HMStudio Announcement Bar v1.1.7
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
      transform: translateX(0);
    `;

    // Add multiple copies of text
    const textContent = document.createElement('span');
    textContent.textContent = settings.announcementText;
    textContent.style.cssText = `
      display: inline-block;
      padding: 0 3rem;
    `;

    // Calculate number of copies needed based on viewport width
    const numCopies = Math.ceil((window.innerWidth * 2) / textContent.offsetWidth) + 2;
    
    for (let i = 0; i < numCopies; i++) {
      const textCopy = textContent.cloneNode(true);
      tickerContent.appendChild(textCopy);
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

    // Animation function
    let translateX = 0;
    const speed = (70 - settings.announcementSpeed) * 0.5; // Convert speed setting to actual speed
    const contentWidth = tickerContent.scrollWidth;

    function animate() {
      translateX += speed;
      
      // Reset translation when it exceeds content width
      if (translateX >= contentWidth / numCopies) {
        translateX = 0;
      }

      tickerContent.style.transform = `translateX(${translateX}px)`;
      requestAnimationFrame(animate);
    }

    // Start animation
    requestAnimationFrame(animate);

    // Pause on hover
    bar.addEventListener('mouseenter', () => {
      tickerContent.style.animationPlayState = 'paused';
    });

    bar.addEventListener('mouseleave', () => {
      tickerContent.style.animationPlayState = 'running';
    });

    // Handle window resize
    function handleResize() {
      const newNumCopies = Math.ceil((window.innerWidth * 2) / textContent.offsetWidth) + 2;
      
      // Add more copies if needed
      while (tickerContent.children.length < newNumCopies) {
        const textCopy = textContent.cloneNode(true);
        tickerContent.appendChild(textCopy);
      }
    }

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
        // Keep the original speed value (5-60) and convert it in the animation
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
