(function () {
  const root = document.documentElement;
  const THEME_KEY = "theme";
  const TRANSITION_KEY = "cursor-page-transition";
  const PAGE_TRANSITION_MS = 720;
  const NAVIGATE_DELAY_MS = 420;
  const AVATAR_START_TIMEOUT_MS = 3200;
  const HOME_PREFETCHES = [
    { href: "about.html" },
    { href: "assets/resume.json", as: "fetch" },
    { href: "js/about.js", as: "script" },
  ];
  const THEME_BACKGROUND = {
    dark: "#0a0a0e",
    light: "#f5efe7",
  };

  const boot = (window.__portfolioBoot = window.__portfolioBoot || {
    page: root.dataset.page || "",
    appLoading: root.dataset.appLoading === "true",
    avatar: {
      state: "idle",
      progress: null,
    },
  });

  const isHome = root.dataset.page === "home";
  const toggle = document.querySelector("[data-toggle]");
  const label = document.querySelector("[data-mode-label]");
  const roleEl = document.querySelector("[data-role]");
  const appLoader = document.querySelector("[data-app-loader]");
  const loaderLabel = document.querySelector("[data-loader-label]");
  const loaderProgress = document.querySelector("[data-loader-progress]");
  const avatarScene = document.getElementById("avatar-scene");
  const avatarStatus = document.getElementById("avatar-loading");
  const resumeModal = document.querySelector("[data-resume-modal]");
  const resumeOpenButton = document.querySelector("[data-resume-open]");
  const resumeCloseButtons = document.querySelectorAll("[data-resume-close]");
  const resumeFrame = document.querySelector("[data-resume-frame]");

  let resumeFrameLoaded = Boolean(resumeFrame?.getAttribute("src"));
  let homeBootDismissed = !isHome || !appLoader;
  let homePrefetchQueued = false;
  let avatarStartTimeoutId = 0;
  let lastAvatarProgress = typeof boot.avatar?.progress === "number" ? boot.avatar.progress : 0;

  try {
    const saved = localStorage.getItem(THEME_KEY);
    root.classList.toggle("light", saved === "light");
  } catch (error) {
    console.warn("Theme restore skipped", error);
  }

  function getTheme() {
    return root.classList.contains("light") ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.classList.toggle("light", theme === "light");

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn("Theme persistence skipped", error);
    }

    syncLabel();
  }

  function syncLabel() {
    const theme = getTheme();
    if (label) label.textContent = theme === "light" ? "Light" : "Dark";
    if (toggle) toggle.setAttribute("aria-checked", String(theme === "light"));
  }

  function setLoaderCopy(labelText, progressText) {
    if (loaderLabel && typeof labelText === "string") {
      loaderLabel.textContent = labelText;
    }

    if (loaderProgress && typeof progressText === "string") {
      loaderProgress.textContent = progressText;
    }
  }

  function setInlineAvatarStatus(message) {
    if (!avatarStatus) return;
    avatarStatus.textContent = message;
    avatarStatus.classList.toggle("is-hidden", message.length === 0);
  }

  function queueHomePrefetch() {
    if (!isHome || homePrefetchQueued) return;
    homePrefetchQueued = true;

    const prefetch = function () {
      for (const asset of HOME_PREFETCHES) {
        if (document.head.querySelector(`link[rel="prefetch"][href="${asset.href}"]`)) {
          continue;
        }

        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = asset.href;
        if (asset.as) link.as = asset.as;
        if (asset.as === "fetch") link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetch, { timeout: 1800 });
      return;
    }

    window.setTimeout(prefetch, 900);
  }

  function completeHomeBoot(copy) {
    if (!isHome) {
      queueHomePrefetch();
      return;
    }

    if (copy) {
      setLoaderCopy(copy.label, copy.progress);
    }

    if (homeBootDismissed || !appLoader) {
      queueHomePrefetch();
      return;
    }

    homeBootDismissed = true;
    boot.appLoading = false;
    root.dataset.appLoading = "false";
    appLoader.classList.add("is-complete");

    window.setTimeout(function () {
      appLoader.hidden = true;
      root.removeAttribute("data-app-loading");
      queueHomePrefetch();
    }, 560);
  }

  function clearAvatarTimeouts() {
    window.clearTimeout(avatarStartTimeoutId);
  }

  function handleAvatarProgress(event) {
    const detail = event.detail || {};
    if (typeof detail.progress === "number") {
      lastAvatarProgress = detail.progress;
    }

    if (!isHome || homeBootDismissed) return;

    const labelText =
      detail.phase === "download" ? "Loading live avatar" : "Preparing portfolio";
    const progressText =
      typeof detail.progress === "number" ? `${detail.progress}%` : "Sync";

    setLoaderCopy(labelText, progressText);
  }

  function handleAvatarReady() {
    clearAvatarTimeouts();
    root.dataset.avatarState = "ready";
    if (avatarScene) avatarScene.classList.add("is-live");
    setInlineAvatarStatus("");
    completeHomeBoot({
      label: "Entering portfolio",
      progress: `${Math.max(lastAvatarProgress, 100)}%`,
    });
  }

  function handleAvatarError(event) {
    const detail = event.detail || {};
    clearAvatarTimeouts();
    root.dataset.avatarState = "error";
    setInlineAvatarStatus(detail.message || "Live avatar failed to load.");
    setLoaderCopy("Avatar failed to load", "Error");
    if (appLoader) {
      appLoader.setAttribute("aria-label", "Avatar failed to load");
    }
  }

  syncLabel();

  if (toggle) {
    toggle.addEventListener("click", function () {
      const nextTheme = getTheme() === "light" ? "dark" : "light";
      runThemeTransition(nextTheme);
    });

    toggle.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle.click();
      }
    });
  }

  if (roleEl) {
    const roles = [
      ["Cybersecurity", "Researcher"],
      ["Software", "Engineer"],
      ["Red Team", "Enthusiast"],
    ];
    let index = 0;

    window.setInterval(function () {
      index = (index + 1) % roles.length;
      roleEl.style.opacity = "0";
      window.setTimeout(function () {
        roleEl.innerHTML = roles[index].join("<br>");
        roleEl.style.opacity = "1";
      }, 350);
    }, 3500);
  }

  function ensureResumeFrameLoaded() {
    if (!resumeFrame || resumeFrameLoaded) return;
    const source = resumeFrame.dataset.src;
    if (!source) return;

    resumeFrame.src = source;
    resumeFrameLoaded = true;
  }

  function openResumeModal() {
    if (!resumeModal) return;
    ensureResumeFrameLoaded();
    resumeModal.hidden = false;
    document.body.classList.add("resume-open");
    if (resumeOpenButton) resumeOpenButton.setAttribute("aria-expanded", "true");
  }

  function closeResumeModal() {
    if (!resumeModal) return;
    resumeModal.hidden = true;
    document.body.classList.remove("resume-open");

    if (resumeOpenButton) {
      resumeOpenButton.setAttribute("aria-expanded", "false");
      resumeOpenButton.focus();
    }
  }

  if (resumeOpenButton) {
    resumeOpenButton.addEventListener("click", openResumeModal);
  }

  resumeCloseButtons.forEach(function (button) {
    button.addEventListener("click", closeResumeModal);
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && resumeModal && !resumeModal.hidden) {
      closeResumeModal();
    }
  });

  if (isHome) {
    setLoaderCopy("Loading portfolio", "0%");

    window.addEventListener("portfolio:avatar-progress", handleAvatarProgress);
    window.addEventListener("portfolio:avatar-ready", handleAvatarReady);
    window.addEventListener("portfolio:avatar-error", handleAvatarError);

    avatarStartTimeoutId = window.setTimeout(function () {
      if (window.__avatarViewerStarted) return;

      handleAvatarError({
        detail: {
          message: "Live avatar failed to start.",
          code: "bootstrap-failed",
        },
      });
    }, AVATAR_START_TIMEOUT_MS);

    if (boot.avatar?.state === "ready") {
      handleAvatarReady();
    } else if (boot.avatar?.state === "error") {
      handleAvatarError({ detail: boot.avatar });
    } else if (boot.avatar?.state === "loading") {
      handleAvatarProgress({ detail: boot.avatar });
    }
  }

  const cursor = document.createElement("div");
  cursor.className = "cursor-blob";
  document.body.appendChild(cursor);

  const transitionOverlay = document.createElement("div");
  transitionOverlay.className = "cursor-transition";
  transitionOverlay.setAttribute("aria-hidden", "true");
  transitionOverlay.hidden = true;
  document.body.appendChild(transitionOverlay);

  let curX = window.innerWidth / 2;
  let curY = window.innerHeight / 2;
  let targetX = curX;
  let targetY = curY;
  const LERP = 0.12;
  let visible = false;

  function showCursor() {
    if (!visible) {
      visible = true;
      cursor.classList.add("is-visible");
    }
  }

  window.addEventListener("pointermove", function (event) {
    targetX = event.clientX;
    targetY = event.clientY;
    showCursor();

    const target = event.target.closest("a, button, [role='button'], [tabindex]");
    cursor.classList.toggle("is-hovering", Boolean(target));
  });

  window.addEventListener("pointerleave", function () {
    cursor.classList.remove("is-visible");
    visible = false;
  });

  window.addEventListener("pointerdown", function () {
    cursor.classList.add("is-clicking");
  });

  window.addEventListener("pointerup", function () {
    cursor.classList.remove("is-clicking");
  });

  function getOverlaySize(x, y) {
    const distances = [
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
    ];

    return Math.ceil(Math.max.apply(null, distances) * 2);
  }

  function prepareOverlay(x, y) {
    const size = getOverlaySize(x, y);
    transitionOverlay.style.width = `${size}px`;
    transitionOverlay.style.height = `${size}px`;
    transitionOverlay.style.left = `${x}px`;
    transitionOverlay.style.top = `${y}px`;
    return size;
  }

  function cleanupOverlay() {
    transitionOverlay.hidden = true;
    transitionOverlay.classList.remove("is-active", "is-collapsing");
    document.body.classList.remove("is-page-transitioning");
    transitionOverlay.style.background = "";
  }

  function getThemeTransitionFill(theme) {
    return THEME_BACKGROUND[theme] || THEME_BACKGROUND.dark;
  }

  function playEntryTransition() {
    const raw = sessionStorage.getItem(TRANSITION_KEY);
    if (!raw) return;

    let state;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      sessionStorage.removeItem(TRANSITION_KEY);
      console.warn("Page transition restore skipped", error);
      return;
    }

    if (state.pathname !== window.location.pathname) return;

    sessionStorage.removeItem(TRANSITION_KEY);
    prepareOverlay(state.x, state.y);
    transitionOverlay.hidden = false;
    transitionOverlay.classList.add("is-active");
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        transitionOverlay.classList.add("is-collapsing");
      });
    });

    window.setTimeout(cleanupOverlay, PAGE_TRANSITION_MS);
  }

  function runLocalTransition(action) {
    prepareOverlay(targetX, targetY);
    transitionOverlay.hidden = false;
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(function () {
      transitionOverlay.classList.add("is-active");
    });

    window.setTimeout(function () {
      action();
      transitionOverlay.classList.add("is-collapsing");
    }, NAVIGATE_DELAY_MS);

    window.setTimeout(cleanupOverlay, PAGE_TRANSITION_MS);
  }

  function runThemeTransition(nextTheme) {
    if (!toggle) return;

    const rect = toggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    prepareOverlay(x, y);
    transitionOverlay.style.background = getThemeTransitionFill(nextTheme);
    transitionOverlay.hidden = false;
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(function () {
      transitionOverlay.classList.add("is-active");
    });

    window.setTimeout(function () {
      applyTheme(nextTheme);
      transitionOverlay.classList.add("is-collapsing");
    }, NAVIGATE_DELAY_MS);

    window.setTimeout(cleanupOverlay, PAGE_TRANSITION_MS);
  }

  function handleNavTransition(event) {
    const link = event.target.closest(".nav a");
    if (!link || link.hasAttribute("download") || link.getAttribute("target") === "_blank") return;
    if (link.getAttribute("aria-current") === "page") return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();

    const x = targetX;
    const y = targetY;
    prepareOverlay(x, y);

    if (url.pathname !== window.location.pathname) {
      sessionStorage.setItem(
        TRANSITION_KEY,
        JSON.stringify({
          pathname: url.pathname,
          x,
          y,
        })
      );

      transitionOverlay.hidden = false;
      document.body.classList.add("is-page-transitioning");
      requestAnimationFrame(function () {
        transitionOverlay.classList.add("is-active");
      });

      window.setTimeout(function () {
        window.location.assign(url.href);
      }, NAVIGATE_DELAY_MS);

      return;
    }

    runLocalTransition(function () {
      if (!url.hash) return;

      const target = document.querySelector(url.hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      window.history.replaceState(null, "", url.hash);
    });
  }

  document.querySelectorAll(".nav").forEach(function (nav) {
    nav.addEventListener("click", handleNavTransition);
  });

  playEntryTransition();

  (function tick() {
    requestAnimationFrame(tick);
    curX += (targetX - curX) * LERP;
    curY += (targetY - curY) * LERP;
    cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
  })();
})();
