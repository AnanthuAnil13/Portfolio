(function () {
  const root = document.documentElement;

  // Apply saved theme
  const saved = localStorage.getItem("theme");
  if (saved === "dark") root.classList.add("dark");

  // Mode toggle
  const toggle = document.querySelector("[data-toggle]");
  const label = document.querySelector("[data-mode-label]");

  function syncLabel(){
    const isDark = root.classList.contains("dark");
    if (label) label.textContent = isDark ? "Mode" : "Mode";
    if (toggle) toggle.setAttribute("aria-checked", String(isDark));
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      root.classList.toggle("dark");
      localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
      syncLabel();
    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle.click();
      }
    });
  }

  syncLabel();

  // Fallback hint if the 3D module fails to start (e.g. bad CDN/module import).
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

})();
