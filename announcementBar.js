// src/scripts/AnnouncementBar.js v1.2.9 the logs cleaned up version(from v1.2.6 last and not logs cleaned up)
// Created by HMStudio

;(() => {
  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript
    const scriptUrl = new URL(scriptTag.src)
    const storeId = scriptUrl.searchParams.get("storeId")
    return storeId ? storeId.split("?")[0] : null
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || "ar"
  }

  const storeId = getStoreIdFromUrl()
  if (!storeId) {
    return
  }

  async function fetchAnnouncementSettings() {
    try {
      const response = await fetch(
        `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getAnnouncementSettings?storeId=${storeId}`,
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      return null
    }
  }

  function createAnnouncementBar(settings) {
    const existingBar = document.getElementById("hmstudio-announcement-bar")
    if (existingBar) {
      existingBar.remove()
    }

    const bar = document.createElement("div")
    bar.id = "hmstudio-announcement-bar"
    bar.style.cssText = `
      width: 100%;
      background-color: ${settings.announcementBackgroundColor};
      color: ${settings.announcementTextColor};
      overflow: hidden;
      height: 40px;
      position: relative;
      z-index: 999999;
    `

    const tickerContent = document.createElement("div")
    tickerContent.id = "tickerContent"
    tickerContent.style.cssText = `
      position: absolute;
      white-space: nowrap;
      height: 100%;
      display: flex;
      align-items: center;
      will-change: transform;
      transform: translateX(0);
    `

    const tempSpan = document.createElement("span")
    tempSpan.textContent = settings.announcementText
    tempSpan.style.cssText = `
      display: inline-block;
      padding: 0 3rem;
      visibility: hidden;
      position: absolute;
    `
    document.body.appendChild(tempSpan)
    const textWidth = tempSpan.offsetWidth
    document.body.removeChild(tempSpan)

    const viewportWidth = window.innerWidth
    const copiesNeeded = Math.ceil((viewportWidth * 3) / textWidth) + 2

    for (let i = 0; i < copiesNeeded; i++) {
      const textSpan = document.createElement("span")
      textSpan.textContent = settings.announcementText
      textSpan.style.cssText = `
        display: inline-block;
        padding: 0 3rem;
      `
      tickerContent.appendChild(textSpan)
    }

    bar.appendChild(tickerContent)

    const targetLocation = document.querySelector(".header")
    if (targetLocation) {
      targetLocation.insertBefore(bar, targetLocation.firstChild)
    } else {
      document.body.insertBefore(bar, document.body.firstChild)
    }

    let currentPosition = 0
    let lastTimestamp = 0
    let animationId
    let isPaused = false

    const minSpeed = 10
    const maxSpeed = 100
    const speedRange = maxSpeed - minSpeed
    const speedPercentage = (60 - settings.announcementSpeed) / 55
    const pixelsPerSecond = minSpeed + speedRange * speedPercentage

    function updateAnimation(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp

      if (!isPaused) {
        const deltaTime = (timestamp - lastTimestamp) / 1000

        const movement = pixelsPerSecond * deltaTime
        currentPosition += movement

        if (currentPosition >= textWidth) {
          currentPosition = currentPosition % textWidth

          const firstItem = tickerContent.children[0]
          tickerContent.appendChild(firstItem.cloneNode(true))
          tickerContent.removeChild(firstItem)
        }

        tickerContent.style.transform = `translate3d(${currentPosition}px, 0, 0)`
      }

      lastTimestamp = timestamp
      animationId = requestAnimationFrame(updateAnimation)
    }

    setTimeout(() => {
      lastTimestamp = 0
      animationId = requestAnimationFrame(updateAnimation)
    }, 100)

    bar.addEventListener("mouseenter", () => {
      isPaused = true
    })

    bar.addEventListener("mouseleave", () => {
      isPaused = false
      lastTimestamp = 0
    })

    function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        isPaused = true
      } else {
        isPaused = false
        lastTimestamp = 0
      }
    })

    window.addEventListener("resize", () => {
      const newViewportWidth = window.innerWidth
      const newCopiesNeeded = Math.ceil((newViewportWidth * 3) / textWidth) + 2

      while (tickerContent.children.length < newCopiesNeeded) {
        const clone = tickerContent.children[0].cloneNode(true)
        tickerContent.appendChild(clone)
      }

      currentPosition = 0
      lastTimestamp = 0
      tickerContent.style.transform = `translate3d(${currentPosition}px, 0, 0)`
    })

    window.addEventListener("unload", cleanup)
  }

  async function initializeAnnouncementBar() {
    const settings = await fetchAnnouncementSettings()
    if (settings && settings.announcementEnabled) {
      createAnnouncementBar({
        ...settings,
        announcementSpeed: Math.max(5, Math.min(60, settings.announcementSpeed)),
      })
    }
  }

  initializeAnnouncementBar()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && !document.getElementById("hmstudio-announcement-bar")) {
        initializeAnnouncementBar()
        break
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
})()

