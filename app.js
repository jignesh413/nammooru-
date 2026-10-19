/**
 * =============================================================================
 * Nammooru — Word Pet Companion (Option B) Data Binding & Dynamic Progression
 * =============================================================================
 * Implements dynamic progression logic driven by user's learning garden
 * and practice tries logged in localStorage.
 */

(function () {
  'use strict';

  /**
   * Generates crisp Neo-Brutalist SVG mascot illustrations for each stage.
   * @param {number} stage - Mascot progression stage (1, 2, or 3)
   * @returns {string} SVG HTML string
   */
  function getMascotSvg(stage) {
    if (stage === 3) {
      // Stage 3: NAMMOORU GURU (Venerable Master Guru Bot with Mysore Peta)
      return `<svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" width="76" height="76" aria-hidden="true">
        <!-- Mysore Peta Turban -->
        <ellipse cx="45" cy="22" rx="30" ry="11" fill="#F59E0B" stroke="#000" stroke-width="2.5"/>
        <path d="M17 22 C17 10 73 10 73 22" fill="#EF4444" stroke="#000" stroke-width="2.5"/>
        <path d="M45 7 L49 14 L45 19 L41 14 Z" fill="#EF4444" stroke="#000" stroke-width="1.8"/>
        <circle cx="45" cy="14" r="2" fill="#FFD027"/>
        <!-- Guru Bot Head -->
        <rect x="17" y="24" width="56" height="50" rx="14" fill="#FEF08A" stroke="#000" stroke-width="2.5"/>
        <!-- Tilak -->
        <circle cx="45" cy="31" r="3" fill="#EF4444" stroke="#000" stroke-width="1.2"/>
        <!-- Wisdom Glasses & Eyes -->
        <circle cx="33" cy="44" r="7.5" stroke="#000" stroke-width="2" fill="#FFFFFF"/>
        <circle cx="57" cy="44" r="7.5" stroke="#000" stroke-width="2" fill="#FFFFFF"/>
        <line x1="40.5" y1="44" x2="49.5" y2="44" stroke="#000" stroke-width="2"/>
        <circle cx="34" cy="44" r="3.5" fill="#111827"/>
        <circle cx="58" cy="44" r="3.5" fill="#111827"/>
        <circle cx="35" cy="42.5" r="1.2" fill="#FFFFFF"/>
        <circle cx="59" cy="42.5" r="1.2" fill="#FFFFFF"/>
        <!-- Guru Mustache -->
        <path d="M35 59 C38 62 42 62 45 58 C48 62 52 62 55 59" stroke="#000" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <!-- Ear Dials -->
        <rect x="11" y="38" width="6" height="16" rx="3" fill="#FFD027" stroke="#000" stroke-width="2"/>
        <rect x="73" y="38" width="6" height="16" rx="3" fill="#FFD027" stroke="#000" stroke-width="2"/>
        <!-- Sparkle Accents -->
        <path d="M10 16 L12 20 L14 16 L12 12 Z" fill="#FFD027" stroke="#000" stroke-width="1"/>
        <path d="M78 16 L80 20 L82 16 L80 12 Z" fill="#FFD027" stroke="#000" stroke-width="1"/>
      </svg>`;
    }

    if (stage === 2) {
      // Stage 2: ROBO-ANNA (Cool Elder Brother Bot with Shades & Scarf)
      return `<svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" width="76" height="76" aria-hidden="true">
        <!-- Antenna -->
        <path d="M45 20 V11" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="45" cy="9" r="4.5" fill="#EF4444" stroke="#000" stroke-width="2"/>
        <!-- Bot Head Base -->
        <rect x="16" y="20" width="58" height="52" rx="14" fill="#FDE047" stroke="#000" stroke-width="2.5"/>
        <!-- Headphone Band & Ear Cups -->
        <path d="M14 32 C14 15 76 15 76 32" stroke="#000" stroke-width="3" stroke-linecap="round" fill="none"/>
        <rect x="9" y="30" width="7" height="24" rx="3.5" fill="#EF4444" stroke="#000" stroke-width="2"/>
        <rect x="74" y="30" width="7" height="24" rx="3.5" fill="#EF4444" stroke="#000" stroke-width="2"/>
        <!-- Cool Sunglasses -->
        <rect x="23" y="31" width="44" height="17" rx="5" fill="#111827" stroke="#000" stroke-width="2"/>
        <path d="M26 35 L36 43" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M42 35 L49 41" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Confident Smile -->
        <path d="M38 57 Q45 64 52 57" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Kannada Flag Ribbon -->
        <rect x="30" y="64" width="30" height="4" rx="1.5" fill="#EF4444" stroke="#000" stroke-width="1.2"/>
        <rect x="30" y="68" width="30" height="4" rx="1.5" fill="#FDE047" stroke="#000" stroke-width="1.2"/>
      </svg>`;
    }

    // Stage 1: CHOTU-BOT (Cute Beginner Bot with Sprout)
    return `<svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" width="76" height="76" aria-hidden="true">
      <!-- Sprout Antenna -->
      <path d="M45 22 V12" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M45 12 C45 6 36 6 36 12 C36 17 45 14 45 12 Z" fill="#22C55E" stroke="#000" stroke-width="2"/>
      <path d="M45 14 C48 8 56 9 55 15 C54 19 46 16 45 14 Z" fill="#4ADE80" stroke="#000" stroke-width="2"/>
      <!-- Bot Head Base -->
      <rect x="16" y="22" width="58" height="52" rx="14" fill="#6EE7B7" stroke="#000" stroke-width="2.5"/>
      <!-- Ear Dials -->
      <rect x="10" y="38" width="6" height="18" rx="3" fill="#FFD027" stroke="#000" stroke-width="2"/>
      <rect x="74" y="38" width="6" height="18" rx="3" fill="#FFD027" stroke="#000" stroke-width="2"/>
      <!-- Screen Visor -->
      <rect x="23" y="29" width="44" height="28" rx="8" fill="#111827" stroke="#000" stroke-width="2"/>
      <!-- Happy Smiling LED Eyes -->
      <path d="M31 43 C31 38 37 38 37 43" stroke="#34D399" stroke-width="3" stroke-linecap="round"/>
      <path d="M53 43 C53 38 59 38 59 43" stroke="#34D399" stroke-width="3" stroke-linecap="round"/>
      <!-- Rosy Cheeks -->
      <ellipse cx="27" cy="63" rx="4.5" ry="2.5" fill="#FB7185"/>
      <ellipse cx="63" cy="63" rx="4.5" ry="2.5" fill="#FB7185"/>
      <!-- Mouth -->
      <path d="M40 62 Q45 66 50 62" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
  }

  /**
   * Safely retrieves an array from localStorage checking primary and legacy fallback keys.
   * @param {string} primaryKey
   * @param {string} fallbackKey
   * @returns {Array}
   */
  function safeGetArray(primaryKey, fallbackKey) {
    try {
      const raw = localStorage.getItem(primaryKey) || (fallbackKey ? localStorage.getItem(fallbackKey) : null);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn(`[WordPet] Failed to parse ${primaryKey}:`, e);
      return [];
    }
  }

  /**
   * Reads nammooru_garden and nammooru_tries from localStorage,
   * updates stats counters, and applies the dynamic progression state.
   */
  function updateWordPetCompanion() {
    // 1. Read nammooru_garden and nammooru_tries from localStorage
    const garden = safeGetArray('nammooru_garden', 'nammooru_garden_v1');
    const tries = safeGetArray('nammooru_tries', 'nammooru_attempts_v1');

    // 2. Set Stats:
    // - "🌱 [garden.length] Bloomed"
    // - "⚡ [tries.length] Tries Logged"
    const bloomedEl = document.getElementById('pet-stat-bloomed');
    const triesEl = document.getElementById('pet-stat-tries');
    if (bloomedEl) bloomedEl.textContent = `🌱 ${garden.length} Bloomed`;
    if (triesEl) triesEl.textContent = `⚡ ${tries.length} Tries Logged`;

    // 3. Dynamic Progression:
    // - If garden.length < 5: Badge = "MASCOT • STAGE 1", Title = "CHOTU-BOT", Kannada = "ಚೋಟು ಬೋಟ್", Quote = "Namaskara! Snap your first word."
    // - If garden.length >= 5 && garden.length < 15: Badge = "MASCOT • STAGE 2", Title = "ROBO-ANNA", Kannada = "ರೋಬೋ ಅಣ್ಣ", Quote = "Hogona! Ready for the next word?"
    // - If garden.length >= 15: Badge = "MASCOT • STAGE 3", Title = "NAMMOORU GURU", Kannada = "ಗುರು ಬೋಟ್", Quote = "Bari mass! Bengaluru belongs to you."
    let stage = 1;
    let badge = 'MASCOT • STAGE 1';
    let title = 'CHOTU-BOT';
    let kannada = 'ಚೋಟು ಬೋಟ್';
    let quote = 'Namaskara! Snap your first word.';

    if (garden.length >= 15) {
      stage = 3;
      badge = 'MASCOT • STAGE 3';
      title = 'NAMMOORU GURU';
      kannada = 'ಗುರು ಬೋಟ್';
      quote = 'Bari mass! Bengaluru belongs to you.';
    } else if (garden.length >= 5) {
      stage = 2;
      badge = 'MASCOT • STAGE 2';
      title = 'ROBO-ANNA';
      kannada = 'ರೋಬೋ ಅಣ್ಣ';
      quote = 'Hogona! Ready for the next word?';
    }

    const badgeEl = document.getElementById('pet-stage-badge');
    const titleEl = document.getElementById('pet-name-en');
    const kannadaEl = document.getElementById('pet-name-kn');
    const quoteEl = document.getElementById('pet-quote-text');
    const visualEl = document.getElementById('pet-mascot-visual');

    if (badgeEl) badgeEl.textContent = badge;
    if (titleEl) titleEl.textContent = title;
    if (kannadaEl) kannadaEl.textContent = kannada;
    if (quoteEl) quoteEl.textContent = quote;
    if (visualEl) visualEl.innerHTML = getMascotSvg(stage);
  }

  // Expose globally for cross-module integration
  window.updateWordPetCompanion = updateWordPetCompanion;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateWordPetCompanion);
  } else {
    updateWordPetCompanion();
  }

  // Cross-tab synchronization
  window.addEventListener('storage', function (e) {
    if (
      e.key === 'nammooru_garden' ||
      e.key === 'nammooru_garden_v1' ||
      e.key === 'nammooru_tries' ||
      e.key === 'nammooru_attempts_v1'
    ) {
      updateWordPetCompanion();
    }
  });

  // Tactile Avatar Wiggle Animation
  document.addEventListener('DOMContentLoaded', function () {
    const avatarBox = document.getElementById('pet-avatar-box');
    if (avatarBox) {
      avatarBox.addEventListener('click', function () {
        avatarBox.classList.add('pet-wobble');
        setTimeout(function () {
          avatarBox.classList.remove('pet-wobble');
        }, 500);
      });
      avatarBox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          avatarBox.click();
        }
      });
    }
  });

})();
