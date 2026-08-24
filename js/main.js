/*
 * Configuration Analytics — modifiez uniquement ces constantes.
 * Mettre ENABLE_ANALYTICS à false désactive totalement le bandeau et Google Analytics.
 * Accepte un Measurement ID GA4 (G-XXXX) ou un conteneur Google Tag Manager (GTM-XXXX).
 */
const ENABLE_ANALYTICS = true;
const GA_MEASUREMENT_ID = "GTM-5S3W59J6";

const CONSENT_STORAGE_KEY = "arthur-maquin-analytics-consent";
const CONSENT_DURATION_MONTHS = 6;
const MATRIX_ROWS = 16;
const MATRIX_PATTERN_DELAY = 10000;
const PATTERN_WIDTH = 72;
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

/* Un motif est choisi à chaque chargement de page. 1 = orange, -1 = blanc. */
const MATRIX_PATTERNS = [
  (row, column) => ((column + row) % 2 === 0 ? 1 : -1),
  (row, column) => ((column + row) % 4 >= 2 ? 1 : -1),
  (row, column) => ((column - row) % 6 === 0 || (column + row) % 6 === 0 ? 1 : -1),
  (row, column) => {
    const span = MATRIX_ROWS - 1;
    const position = (column + 9) % (span * 2);
    const target = position <= span ? position : (span * 2) - position;
    return (row >= target - 1 && row <= target + 1) ? 1 : -1;
  },
  (row, column) => {
    const target = Math.round(((MATRIX_ROWS - 1) / 2) + Math.sin(column / 4) * 4);
    return Math.abs(row - target) <= 1 ? 1 : -1;
  },
  (row, column) => {
    const x = (column % PATTERN_WIDTH) - ((PATTERN_WIDTH - 1) / 2);
    const y = row - ((MATRIX_ROWS - 1) / 2);
    return Math.floor(Math.hypot(x, y)) % 5 === 0 ? 1 : -1;
  },
  (row, column) => BAYER_4[row % 4][column % 4] < 7 ? 1 : -1,
  (row, column) => {
    const x = (column % PATTERN_WIDTH) - ((PATTERN_WIDTH - 1) / 2);
    const y = row + 1;
    const ray = Math.abs(Math.abs(x) - y * 3) < 1.25;
    const horizon = row === 3 || row === 8 || row === 13;
    return ray || horizon ? 1 : -1;
  }
];

function analyticsIsAvailable() {
  return ENABLE_ANALYTICS && analyticsProvider() !== null;
}

function analyticsProvider() {
  if (/^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") return "ga4";
  if (/^GTM-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID)) return "gtm";
  return null;
}

function loadAnalytics() {
  if (window.__analyticsLoaded || !analyticsIsAvailable()) return;

  window.__analyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  const script = document.createElement("script");
  script.async = true;

  if (analyticsProvider() === "gtm") {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  } else {
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  }

  document.head.appendChild(script);
}

function getConsent() {
  try {
    const savedConsent = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    if (!savedConsent || !["accepted", "rejected"].includes(savedConsent.choice) || savedConsent.expiresAt <= Date.now()) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    return savedConsent.choice;
  } catch {
    return null;
  }
}

function saveConsent(choice) {
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + CONSENT_DURATION_MONTHS);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice, expiresAt: expiresAt.getTime() }));
  } catch { /* Les réglages privés peuvent bloquer le stockage local. */ }
}

function setConsent(choice) {
  saveConsent(choice);
  if (choice === "accepted") loadAnalytics();
  document.querySelector(".consent-banner")?.remove();
  updatePrivacyControls();
}

function createConsentBanner() {
  const banner = document.createElement("aside");
  banner.className = "consent-banner";
  banner.setAttribute("aria-label", "Choix concernant la mesure d’audience");
  banner.innerHTML = `
    <p>Ce site utilise Google Analytics, avec votre accord, pour mesurer son audience. <a href="privacy.html">En savoir plus</a></p>
    <div class="consent-banner__actions">
      <button class="button button--primary" type="button" data-consent-action="accept">Accepter</button>
      <button class="button" type="button" data-consent-action="reject">Refuser</button>
    </div>`;
  document.body.appendChild(banner);
}

function updatePrivacyControls() {
  const controls = document.querySelector("[data-privacy-controls]");
  const unavailable = document.querySelector("[data-analytics-unavailable]");
  if (!controls && !unavailable) return;

  if (!analyticsIsAvailable()) {
    if (unavailable) unavailable.hidden = false;
    return;
  }

  if (controls) {
    controls.hidden = false;
    const status = controls.querySelector("[data-consent-status]");
    const consent = getConsent();
    status.textContent = consent === "accepted" ? "Votre choix actuel : mesure d’audience acceptée." : consent === "rejected" ? "Votre choix actuel : mesure d’audience refusée." : "Vous n’avez pas encore fait de choix.";
  }
}

function initialiseAnalyticsConsent() {
  if (!analyticsIsAvailable()) {
    updatePrivacyControls();
    return;
  }

  const consent = getConsent();
  if (consent === "accepted") loadAnalytics();
  else if (consent !== "rejected") createConsentBanner();
  updatePrivacyControls();
}

function initialiseMatrix() {
  const matrix = document.querySelector("[data-matrix]");
  if (!matrix) return;

  const state = [];
  let patternIndex = Math.floor(Math.random() * MATRIX_PATTERNS.length);
  let initialPattern = MATRIX_PATTERNS[patternIndex];
  let logicalColumns = 0;
  let visibleColumns = 0;
  let resizeFrame;
  let inactivityTimer;
  let sweepTimer;
  let patternTimer;

  function ensureColumns(columns) {
    while (logicalColumns < columns) {
      for (let row = 0; row < MATRIX_ROWS; row += 1) {
        state[row].push(initialPattern(row, logicalColumns));
      }
      logicalColumns += 1;
    }
  }

  for (let row = 0; row < MATRIX_ROWS; row += 1) state.push([]);

  function renderCell(cell, row, column) {
    cell.className = "matrix__cell";
    if (state[row][column] === 1) cell.classList.add("is-active");
    cell.dataset.row = row;
    cell.dataset.column = column;
  }

  function flip(row, column) {
    if (row < 0 || row >= MATRIX_ROWS || column < 0 || column >= logicalColumns) return;
    state[row][column] *= -1;
    const visibleCell = matrix.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (visibleCell && !visibleCell.classList.contains("is-hovered")) renderCell(visibleCell, row, column);
  }

  function activate(cell) {
    cancelSweep();
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.column);
    state[row][column] = 1;
    cell.classList.add("is-active", "is-hovered");
    flip(row - 1, column);
    flip(row + 1, column);
    flip(row, column - 1);
    flip(row, column + 1);
  }

  function cancelSweep() {
    clearTimeout(inactivityTimer);
    clearTimeout(sweepTimer);
    clearTimeout(patternTimer);
    inactivityTimer = undefined;
    sweepTimer = undefined;
    patternTimer = undefined;
  }

  function resetColumn(column) {
    for (let row = 0; row < MATRIX_ROWS; row += 1) {
      state[row][column] = initialPattern(row, column);
      const cell = matrix.querySelector(`[data-row="${row}"][data-column="${column}"]`);
      if (cell && !cell.classList.contains("is-hovered")) renderCell(cell, row, column);
    }
  }

  function restoreInitialPattern(column = 0) {
    if (column >= visibleColumns) {
      for (let hiddenColumn = visibleColumns; hiddenColumn < logicalColumns; hiddenColumn += 1) {
        resetColumn(hiddenColumn);
      }
      sweepTimer = undefined;
      schedulePatternChange();
      return;
    }

    resetColumn(column);
    sweepTimer = setTimeout(() => restoreInitialPattern(column + 1), 50);
  }

  function scheduleRestore() {
    cancelSweep();
    inactivityTimer = setTimeout(() => restoreInitialPattern(), 3000);
  }

  function isInitialPattern() {
    for (let row = 0; row < MATRIX_ROWS; row += 1) {
      for (let column = 0; column < logicalColumns; column += 1) {
        if (state[row][column] !== initialPattern(row, column)) return false;
      }
    }
    return true;
  }

  function changePattern() {
    if (!isInitialPattern()) return;

    const offset = 1 + Math.floor(Math.random() * (MATRIX_PATTERNS.length - 1));
    patternIndex = (patternIndex + offset) % MATRIX_PATTERNS.length;
    initialPattern = MATRIX_PATTERNS[patternIndex];
    restoreInitialPattern();
  }

  function schedulePatternChange() {
    clearTimeout(patternTimer);
    if (!isInitialPattern()) return;
    patternTimer = setTimeout(changePattern, MATRIX_PATTERN_DELAY);
  }

  function build() {
    if (matrix.offsetParent === null) return;
    const height = matrix.clientHeight;
    if (!height) return;
    const cellSize = (height - (MATRIX_ROWS - 1) * 2) / MATRIX_ROWS;
    const columns = Math.max(1, Math.floor((matrix.clientWidth + 2) / (cellSize + 2)));
    ensureColumns(columns);
    visibleColumns = columns;
    matrix.style.gridTemplateColumns = `repeat(${visibleColumns}, minmax(0, 1fr))`;
    matrix.replaceChildren();

    const fragment = document.createDocumentFragment();
    for (let row = 0; row < MATRIX_ROWS; row += 1) {
      for (let column = 0; column < visibleColumns; column += 1) {
        const cell = document.createElement("span");
        renderCell(cell, row, column);
        cell.addEventListener("mouseenter", () => activate(cell));
        cell.addEventListener("mouseleave", () => cell.classList.remove("is-hovered"));
        fragment.appendChild(cell);
      }
    }
    matrix.appendChild(fragment);
  }

  matrix.addEventListener("mouseenter", cancelSweep);
  matrix.addEventListener("mouseleave", scheduleRestore);

  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(build);
  });
  observer.observe(matrix);
  build();
  schedulePatternChange();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-consent-action]");
  if (!button) return;
  setConsent(button.dataset.consentAction === "accept" ? "accepted" : "rejected");
});

document.addEventListener("DOMContentLoaded", () => {
  initialiseAnalyticsConsent();
  initialiseMatrix();
});
