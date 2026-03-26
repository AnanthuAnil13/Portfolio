(function () {
  const root = document.documentElement;
  const THEME_KEY = "theme";

  // Apply saved theme
  const saved = localStorage.getItem(THEME_KEY);
  root.classList.toggle("light", saved === "light");

  // Mode toggle
  const toggle = document.querySelector("[data-toggle]");
  const label = document.querySelector("[data-mode-label]");

  function getTheme() {
    return root.classList.contains("light") ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.classList.toggle("light", theme === "light");
    localStorage.setItem(THEME_KEY, theme);
    syncLabel();
  }

  function syncLabel(){
    const theme = getTheme();
    if (label) label.textContent = theme === "light" ? "Light" : "Dark";
    if (toggle) toggle.setAttribute("aria-checked", String(theme === "light"));
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const nextTheme = getTheme() === "light" ? "dark" : "light";
      runThemeTransition(nextTheme);
    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle.click();
      }
    });
  }

  syncLabel();

  // Fallback hint if the 3D module fails to start
  const avatarLoadingEl = document.getElementById("avatar-loading");
  if (avatarLoadingEl) {
    setTimeout(function () {
      if (!window.__avatarViewerStarted) {
        avatarLoadingEl.textContent = "3D viewer failed to start. Refresh and check console.";
      }
    }, 4000);
  }

  // Role cycling for cinematic hero
  const roleEl = document.querySelector("[data-role]");
  if (roleEl) {
    const roles = [
      ["Cybersecurity", "Researcher"],
      ["Software", "Engineer"],
      ["Red Team", "Enthusiast"],
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % roles.length;
      roleEl.style.opacity = "0";
      setTimeout(() => {
        roleEl.innerHTML = roles[i].join("<br>");
        roleEl.style.opacity = "1";
      }, 350);
    }, 3500);
  }

  // Resume modal
  const resumeModal = document.querySelector("[data-resume-modal]");
  const resumeOpenButton = document.querySelector("[data-resume-open]");
  const resumeCloseButtons = document.querySelectorAll("[data-resume-close]");

  function openResumeModal() {
    if (!resumeModal) return;
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

  resumeCloseButtons.forEach((button) => {
    button.addEventListener("click", closeResumeModal);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && resumeModal && !resumeModal.hidden) {
      closeResumeModal();
    }
  });

  // ============================================================
  // CURSOR — solid circle with mix-blend-mode: difference
  // Inverts whatever colours sit beneath it automatically.
  // ============================================================
  const cursor = document.createElement("div");
  cursor.className = "cursor-blob";
  document.body.appendChild(cursor);

  const transitionOverlay = document.createElement("div");
  transitionOverlay.className = "cursor-transition";
  transitionOverlay.setAttribute("aria-hidden", "true");
  transitionOverlay.hidden = true;
  document.body.appendChild(transitionOverlay);

  let curX = window.innerWidth  / 2;
  let curY = window.innerHeight / 2;
  let targetX = curX;
  let targetY = curY;
  const LERP = 0.12;
  const TRANSITION_KEY = "cursor-page-transition";
  const PAGE_TRANSITION_MS = 720;
  const NAVIGATE_DELAY_MS = 420;
  const THEME_BACKGROUND = {
    dark: "#0a0a0e",
    light: "#f5efe7",
  };

  let visible = false;

  function show() {
    if (!visible) {
      visible = true;
      cursor.classList.add("is-visible");
    }
  }

  window.addEventListener("pointermove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    show();

    // Grow slightly when hovering interactive elements
    const tag = e.target.closest("a, button, [role='button'], [tabindex]");
    cursor.classList.toggle("is-hovering", !!tag);
  });

  window.addEventListener("pointerleave", () => {
    cursor.classList.remove("is-visible");
    visible = false;
  });

  window.addEventListener("pointerdown", () => cursor.classList.add("is-clicking"));
  window.addEventListener("pointerup",   () => cursor.classList.remove("is-clicking"));

  function getOverlaySize(x, y) {
    const distances = [
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
    ];
    return Math.ceil(Math.max(...distances) * 2);
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
    } catch {
      sessionStorage.removeItem(TRANSITION_KEY);
      return;
    }

    const currentPath = window.location.pathname;
    if (state.pathname !== currentPath) return;

    sessionStorage.removeItem(TRANSITION_KEY);
    prepareOverlay(state.x, state.y);
    transitionOverlay.hidden = false;
    transitionOverlay.classList.add("is-active");
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionOverlay.classList.add("is-collapsing");
      });
    });

    window.setTimeout(cleanupOverlay, PAGE_TRANSITION_MS);
  }

  function runLocalTransition(action) {
    prepareOverlay(targetX, targetY);
    transitionOverlay.hidden = false;
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(() => {
      transitionOverlay.classList.add("is-active");
    });

    window.setTimeout(() => {
      action();
      transitionOverlay.classList.add("is-collapsing");
    }, NAVIGATE_DELAY_MS);

    window.setTimeout(cleanupOverlay, PAGE_TRANSITION_MS);
  }

  function runThemeTransition(nextTheme) {
    if (!toggle) return;

    const rect = toggle.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);

    prepareOverlay(x, y);
    transitionOverlay.style.background = getThemeTransitionFill(nextTheme);
    transitionOverlay.hidden = false;
    document.body.classList.add("is-page-transitioning");

    requestAnimationFrame(() => {
      transitionOverlay.classList.add("is-active");
    });

    window.setTimeout(() => {
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
      sessionStorage.setItem(TRANSITION_KEY, JSON.stringify({
        pathname: url.pathname,
        x,
        y,
      }));

      transitionOverlay.hidden = false;
      document.body.classList.add("is-page-transitioning");
      requestAnimationFrame(() => {
        transitionOverlay.classList.add("is-active");
      });

      window.setTimeout(() => {
        window.location.assign(url.href);
      }, NAVIGATE_DELAY_MS);
      return;
    }

    runLocalTransition(() => {
      if (url.hash) {
        const target = document.querySelector(url.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        window.history.replaceState(null, "", url.hash);
      }
    });
  }

  document.querySelectorAll(".nav").forEach((nav) => {
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
