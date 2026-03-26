(function () {
  const nameEl = document.querySelector("[data-about-name]");
  const titleEl = document.querySelector("[data-about-title]");
  const summaryEl = document.querySelector("[data-about-summary]");
  const metaEl = document.querySelector("[data-about-meta]");
  const experienceEl = document.querySelector("[data-about-experience]");
  const educationEl = document.querySelector("[data-about-education]");
  const emailLink = document.querySelector("[data-about-email]");
  const linkedinLink = document.querySelector("[data-about-linkedin]");

  if (!nameEl || !titleEl || !summaryEl || !metaEl || !experienceEl || !educationEl) {
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char];
    });
  }

  function normalizeResume(payload) {
    let resume = payload;
    if (Array.isArray(resume)) resume = resume[0] ?? {};
    if (resume && typeof resume === "object" && "resume" in resume) resume = resume.resume;
    return resume && typeof resume === "object" ? resume : null;
  }

  function createMetaMarkup(resume) {
    const contact = resume.contact ?? {};
    const expCount = Array.isArray(resume.experience) ? resume.experience.length : 0;
    const eduCount = Array.isArray(resume.education) ? resume.education.length : 0;

    const cards = [
      { label: "Based In", value: contact.address || "Unavailable" },
      { label: "Experience", value: `${expCount} roles` },
      { label: "Education", value: `${eduCount} programs` },
      { label: "Email", value: contact.email || "Unavailable" },
    ];

    return cards.map((card) => `
      <article class="about-stat">
        <p class="about-stat__label">${escapeHtml(card.label)}</p>
        <p class="about-stat__value">${escapeHtml(card.value)}</p>
      </article>
    `).join("");
  }

  function parseDuration(duration) {
    const text = String(duration || "").trim();
    const months = {
      january: "Jan",
      february: "Feb",
      march: "Mar",
      april: "Apr",
      may: "May",
      june: "Jun",
      july: "Jul",
      august: "Aug",
      september: "Sep",
      october: "Oct",
      november: "Nov",
      december: "Dec",
    };

    const startSegment = text.split(" - ")[0] || "";
    const parts = startSegment.trim().split(/\s+/);
    const month = months[(parts[0] || "").toLowerCase()] || "Now";
    const yearMatch = startSegment.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : "";

    return {
      month,
      year,
      shortYear: year ? year.slice(-2) : "--",
      full: text,
    };
  }

  function summarizeResponsibilities(items) {
    if (!items.length) return "Selected work and delivery highlights.";
    return items[0];
  }

  function createExperienceMarkup(items) {
    if (!items.length) {
      return '<p class="about-empty">No experience added yet.</p>';
    }

    return items.map((item, index) => {
      const responsibilities = Array.isArray(item.responsibilities) ? item.responsibilities : [];
      const badge = parseDuration(item.duration);
      const sideClass = index % 2 === 0 ? "timeline-entry--left" : "timeline-entry--right";
      const isActive = index === 0 ? " is-active" : "";
      const summary = summarizeResponsibilities(responsibilities);

      return `
        <article class="timeline-entry ${sideClass}${isActive}" data-timeline-entry>
          <div class="timeline-entry__column timeline-entry__column--content">
            <div class="timeline-entry__content">
              <p class="timeline-entry__eyebrow">${escapeHtml(badge.full || item.duration || "")}</p>
              <h3 class="timeline-entry__title">${escapeHtml(item.position || "Role")}</h3>
              <div class="timeline-entry__meta">
                <p class="timeline-entry__company">${escapeHtml(item.company || "Company")}</p>
                <p class="timeline-entry__location">${escapeHtml(item.location || "")}</p>
              </div>
              <p class="timeline-entry__summary">${escapeHtml(summary)}</p>
              ${responsibilities.length ? `
                <button class="timeline-entry__toggle" type="button" data-timeline-toggle aria-expanded="${index === 0 ? "true" : "false"}">
                  Highlights
                </button>
                <div class="timeline-entry__details"${index === 0 ? "" : " hidden"}>
                  <ul class="timeline-entry__list">
                    ${responsibilities.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
            </div>
          </div>
          <div class="timeline-entry__column timeline-entry__column--marker" aria-hidden="true">
            <div class="timeline-entry__line"></div>
            <div class="timeline-badge">
              <span class="timeline-badge__month">${escapeHtml(badge.month)}</span>
              <span class="timeline-badge__year">${escapeHtml(badge.shortYear)}</span>
            </div>
            <span class="timeline-entry__dot"></span>
          </div>
          <div class="timeline-entry__column timeline-entry__column--spacer"></div>
        </article>
      `;
    }).join("");
  }

  function createEducationMarkup(items) {
    if (!items.length) {
      return '<p class="about-empty">No education added yet.</p>';
    }

    return items.map((item) => {
      const activities = Array.isArray(item.activities) ? item.activities : [];

      return `
        <article class="about-card">
          <p class="about-card__eyebrow">${escapeHtml(item.duration || "")}</p>
          <h3 class="about-card__title">${escapeHtml(item.institution || "Institution")}</h3>
          <p class="about-card__subtitle">${escapeHtml(item.degree || "")}</p>
          ${activities.length ? `
            <ul class="about-card__list">
              ${activities.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
            </ul>
          ` : ""}
        </article>
      `;
    }).join("");
  }

  function renderError(message) {
    const safeMessage = escapeHtml(message);
    nameEl.textContent = "Unable to load profile";
    titleEl.textContent = "Resume data could not be read.";
    summaryEl.textContent = "Serve the site through a local web server so the browser can fetch assets/resume.json.";
    metaEl.innerHTML = `<article class="about-stat"><p class="about-stat__label">Status</p><p class="about-stat__value">${safeMessage}</p></article>`;
    experienceEl.innerHTML = `<p class="about-empty">${safeMessage}</p>`;
    educationEl.innerHTML = `<p class="about-empty">${safeMessage}</p>`;
  }

  function setupTimelineInteractions() {
    const entries = Array.from(document.querySelectorAll("[data-timeline-entry]"));
    if (!entries.length) return;

    entries.forEach((entry) => {
      const toggle = entry.querySelector("[data-timeline-toggle]");
      const details = entry.querySelector(".timeline-entry__details");

      if (!toggle || !details) return;

      toggle.addEventListener("click", () => {
        const willOpen = details.hidden;

        entries.forEach((item) => {
          item.classList.remove("is-active");
          const itemToggle = item.querySelector("[data-timeline-toggle]");
          const itemDetails = item.querySelector(".timeline-entry__details");
          if (itemToggle) itemToggle.setAttribute("aria-expanded", "false");
          if (itemDetails) itemDetails.hidden = true;
        });

        if (willOpen) {
          entry.classList.add("is-active");
          toggle.setAttribute("aria-expanded", "true");
          details.hidden = false;
        }
      });

      entry.addEventListener("mouseenter", () => {
        entries.forEach((item) => item.classList.remove("is-peek"));
        if (!entry.classList.contains("is-active")) {
          entry.classList.add("is-peek");
        }
      });

      entry.addEventListener("mouseleave", () => {
        entry.classList.remove("is-peek");
      });
    });
  }

  async function loadResume() {
    try {
      const response = await fetch("assets/resume.json");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const resume = normalizeResume(payload);
      if (!resume) {
        throw new Error("Resume payload is empty.");
      }

      document.title = `${resume.name || "Ananthu Anil"} | About`;
      nameEl.textContent = resume.name || "Ananthu Anil";
      titleEl.textContent = resume.title || "";
      summaryEl.textContent = resume.summary || "";
      metaEl.innerHTML = createMetaMarkup(resume);
      experienceEl.innerHTML = createExperienceMarkup(resume.experience || []);
      educationEl.innerHTML = createEducationMarkup(resume.education || []);
      setupTimelineInteractions();

      const contact = resume.contact ?? {};
      if (emailLink) {
        emailLink.href = contact.email ? `mailto:${contact.email}` : "#";
      }
      if (linkedinLink) {
        linkedinLink.href = contact.linkedin || "#";
      }
    } catch (error) {
      console.error("Failed to load resume.json", error);
      renderError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  loadResume();
})();
