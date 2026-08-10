/*
 * Configuration Analytics — modifiez uniquement ces constantes.
 * Mettre ENABLE_ANALYTICS à false désactive totalement le bandeau et Google Analytics.
 */
const ENABLE_ANALYTICS = true;
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

const CONSENT_STORAGE_KEY = "arthur-maquin-analytics-consent";
const MATRIX_ROWS = 16;

function analyticsIsAvailable() {
  return ENABLE_ANALYTICS && /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX";
}

function loadAnalytics() {
  if (window.__analyticsLoaded || !analyticsIsAvailable()) return;

  window.__analyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

function getConsent() {
  try { return localStorage.getItem(CONSENT_STORAGE_KEY); } catch { return null; }
}

function saveConsent(choice) {
  try { localStorage.setItem(CONSENT_STORAGE_KEY, choice); } catch { /* Les réglages privés peuvent bloquer le stockage local. */ }
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
  let logicalColumns = 0;
  let visibleColumns = 0;
  let resizeFrame;

  function ensureColumns(columns) {
    while (logicalColumns < columns) {
      for (let row = 0; row < MATRIX_ROWS; row += 1) state[row].push(-1);
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
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.column);
    state[row][column] = 1;
    cell.classList.add("is-active", "is-hovered");
    flip(row - 1, column);
    flip(row + 1, column);
    flip(row, column - 1);
    flip(row, column + 1);
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

  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(build);
  });
  observer.observe(matrix);
  build();
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
