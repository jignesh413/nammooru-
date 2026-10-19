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

  // Tactile Avatar Wiggle Animation & Null-Safe Button Bindings
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

    // Guard button listeners against null elements
    const oldResetBtn = document.getElementById('btn-photo-reset');
    if (oldResetBtn) {
      oldResetBtn.addEventListener('click', function () {
        if (typeof window.removeActivePhoto === 'function') window.removeActivePhoto();
      });
    }

    const oldHistoryBtn = document.getElementById('btn-history-trigger');
    if (oldHistoryBtn) {
      oldHistoryBtn.addEventListener('click', function () {
        if (typeof window.openHistoryModal === 'function') window.openHistoryModal();
      });
    }
  });

  /**
   * Safe camera start function with user-friendly error fallbacks.
   */
  async function safeStartCamera() {
    if (typeof window.startCamera === 'function' && window.startCamera !== safeStartCamera) {
      return window.startCamera();
    }
    const feedbackEl = document.getElementById('photo-feedback');
    const showMsg = (msg, isErr = false) => {
      if (feedbackEl) {
        feedbackEl.textContent = msg;
        feedbackEl.className = isErr ? 'feedback-banner active error' : 'feedback-banner active info';
        feedbackEl.removeAttribute('hidden');
        setTimeout(() => feedbackEl.setAttribute('hidden', 'true'), 5000);
      } else {
        alert(msg);
      }
    };

    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .catch((err) => {
            console.warn('[Camera Permission / Hardware]: getUserMedia rejected:', err);
            let friendlyError = 'Camera access was denied or is unavailable. Please check your camera permissions or choose a photo from Gallery.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              friendlyError = 'Camera permission denied. Please allow camera access in browser settings or choose a photo from Gallery.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              friendlyError = 'No camera found on this device. Please upload an image using GALLERY.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
              friendlyError = 'Camera hardware is busy in another app. Please close other camera apps and try again.';
            }
            showMsg(friendlyError, true);
            return null;
          });
        return stream;
      } catch (err) {
        showMsg('Could not open camera. Please use GALLERY to select a photo.', true);
        return null;
      }
    } else {
      showMsg('Your browser does not support direct camera capture. Please select a photo from your gallery.', true);
      return null;
    }
  }

  if (!window.startCamera) {
    window.startCamera = safeStartCamera;
  }

  // =============================================================================
  // WORD GARDEN BIOME: 16-BIT MINECRAFT PIXEL GARDEN CONTROLLER
  // =============================================================================

  /**
   * Generates crisp 16-bit voxel/pixel SVG flowers matching classic Minecraft flora.
   */
  function getMinecraftCropSvg(index) {
    const flowers = [
      // 0: Red Poppy / Rose
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="10" width="2" height="6" fill="#3D6E1E"/>
        <rect x="5" y="12" width="2" height="2" fill="#589C27"/>
        <rect x="9" y="11" width="2" height="2" fill="#589C27"/>
        <rect x="5" y="4" width="6" height="6" fill="#DD2222"/>
        <rect x="6" y="3" width="4" height="2" fill="#FF4444"/>
        <rect x="4" y="5" width="2" height="4" fill="#AA1111"/>
        <rect x="10" y="5" width="2" height="4" fill="#880000"/>
        <rect x="7" y="6" width="2" height="2" fill="#2B1408"/>
      </svg>`,
      // 1: Dandelion (Yellow)
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="9" width="2" height="7" fill="#3D6E1E"/>
        <rect x="9" y="12" width="2" height="2" fill="#589C27"/>
        <rect x="5" y="4" width="6" height="5" fill="#FFDD00"/>
        <rect x="6" y="3" width="4" height="1" fill="#FFFF55"/>
        <rect x="4" y="5" width="1" height="3" fill="#DDBB00"/>
        <rect x="11" y="5" width="1" height="3" fill="#AA8800"/>
        <rect x="7" y="5" width="2" height="2" fill="#FF8800"/>
      </svg>`,
      // 2: Blue Orchid
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="10" width="2" height="6" fill="#3D6E1E"/>
        <rect x="5" y="11" width="2" height="2" fill="#589C27"/>
        <rect x="5" y="3" width="3" height="7" fill="#3399FF"/>
        <rect x="8" y="5" width="4" height="5" fill="#1177EE"/>
        <rect x="6" y="2" width="2" height="2" fill="#77CCFF"/>
        <rect x="7" y="6" width="2" height="2" fill="#EEEEEE"/>
      </svg>`,
      // 3: Allium (Pink / Magenta)
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="8" width="2" height="8" fill="#3D6E1E"/>
        <rect x="5" y="3" width="6" height="5" fill="#D05BE3"/>
        <rect x="6" y="2" width="4" height="2" fill="#F18CFF"/>
        <rect x="4" y="4" width="2" height="3" fill="#A832BC"/>
        <rect x="10" y="4" width="2" height="3" fill="#7F1C91"/>
        <rect x="7" y="4" width="2" height="2" fill="#FFFFFF"/>
      </svg>`,
      // 4: Sunflower
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="9" width="2" height="7" fill="#3D6E1E"/>
        <rect x="4" y="11" width="3" height="2" fill="#589C27"/>
        <rect x="4" y="3" width="8" height="6" fill="#FFAA00"/>
        <rect x="5" y="2" width="6" height="2" fill="#FFCC00"/>
        <rect x="6" y="4" width="4" height="4" fill="#5A320A"/>
      </svg>`,
      // 5: White Tulip
      `<svg viewBox="0 0 16 16" width="38" height="38" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="7" y="9" width="2" height="7" fill="#3D6E1E"/>
        <rect x="9" y="11" width="2" height="2" fill="#589C27"/>
        <rect x="5" y="4" width="6" height="5" fill="#EAEAEA"/>
        <rect x="6" y="3" width="4" height="2" fill="#FFFFFF"/>
        <rect x="4" y="5" width="2" height="3" fill="#CCCCCC"/>
        <rect x="10" y="5" width="2" height="3" fill="#AAAAAA"/>
        <rect x="7" y="5" width="2" height="2" fill="#FFFF77"/>
      </svg>`
    ];
    return flowers[index % flowers.length];
  }

  const SPROUT_SVG = `<svg viewBox="0 0 16 16" width="26" height="26" style="image-rendering: pixelated;" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="7" y="10" width="2" height="6" fill="#3D6E1E"/>
    <rect x="5" y="8" width="3" height="3" fill="#589C27"/>
    <rect x="8" y="7" width="3" height="3" fill="#70C431"/>
  </svg>`;

  let activeInspectCrop = null;

  function openWordGardenBiome() {
    const deck = document.getElementById('learn-deck-view');
    const garden = document.getElementById('word-garden-container');
    if (deck) deck.style.display = 'none';
    if (garden) {
      garden.style.display = 'block';
      renderMinecraftGarden();
    }
    // Scroll viewport to top of garden
    const content = document.querySelector('.app-content');
    if (content) content.scrollTop = 0;
  }

  function closeWordGardenBiome() {
    const deck = document.getElementById('learn-deck-view');
    const garden = document.getElementById('word-garden-container');
    if (garden) garden.style.display = 'none';
    if (deck) deck.style.display = 'block';
    closeInspectModal();
  }

  function openInspectModal(crop, flowerSvg) {
    activeInspectCrop = crop;
    const backdrop = document.getElementById('mc-inspect-backdrop');
    const modal = document.getElementById('mc-inspect-modal');
    const iconEl = document.getElementById('mc-inspect-icon');
    const knEl = document.getElementById('mc-inspect-kannada');
    const roEl = document.getElementById('mc-inspect-roman');
    const meEl = document.getElementById('mc-inspect-meaning');

    if (iconEl) iconEl.innerHTML = flowerSvg;
    if (knEl) knEl.textContent = crop.kannada || '--';
    if (roEl) roEl.textContent = crop.translit || crop.pronunciation || crop.roman || '--';
    if (meEl) meEl.textContent = crop.english || crop.meaning || '--';

    if (backdrop) backdrop.style.display = 'flex';
    if (modal) modal.style.display = 'block';
  }

  function closeInspectModal() {
    activeInspectCrop = null;
    const backdrop = document.getElementById('mc-inspect-backdrop');
    const modal = document.getElementById('mc-inspect-modal');
    if (backdrop) backdrop.style.display = 'none';
    if (modal) modal.style.display = 'none';
  }

  /**
   * Speaks authentic Kannada words with resilient multi-tier fallback:
   * Tier 1: Authentic native Kannada voice (kn-IN)
   * Tier 2: Indian accent voice (en-IN / hi-IN) speaking Romanized phonetic transliteration
   * Tier 3: Universal system voice speaking Romanized pronunciation
   */
  let activeAudioPlayer = null;

  function stopAllSpeechAudio() {
    if (activeAudioPlayer) {
      try {
        activeAudioPlayer.pause();
        activeAudioPlayer.currentTime = 0;
      } catch (_) {}
      activeAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  function fallbackToBrowserVoice(cleanKannada, resetBtn) {
    if (!('speechSynthesis' in window)) {
      if (resetBtn) resetBtn();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices() || [];
      const knVoices = voices.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang === 'kn-in' || lang.startsWith('kn') || name.includes('kannada') || name.includes('ಕನ್ನಡ');
      });

      const knFemaleVoice = knVoices.find(v => {
        const name = (v.name || '').toLowerCase();
        return name.includes('sapna') || name.includes('ಸಪ್ನಾ') || name.includes('female') ||
               (!name.includes('gagan') && !name.includes('ಗಗನ್') && !name.includes('male'));
      }) || knVoices[0] || null;

      const u = new SpeechSynthesisUtterance(cleanKannada);
      if (knFemaleVoice) {
        u.voice = knFemaleVoice;
        u.lang = knFemaleVoice.lang || 'kn-IN';
      } else {
        u.lang = 'kn-IN';
      }
      u.rate = 0.75;
      u.pitch = 1.0;
      u.volume = 1.0;

      u.onend = () => { if (resetBtn) resetBtn(); };
      u.onerror = () => { if (resetBtn) resetBtn(); };
      window.speechSynthesis.speak(u);
    } catch (e) {
      if (resetBtn) resetBtn();
    }
  }

  /**
   * Speaks authentic Kannada words like a native local female speaker:
   * 1. Primary: Streams pure, authentic local Kannada female pronunciation from /api/tts
   * 2. Playback rate set to 0.85 for a clear, deliberate, easy-to-learn cadence
   * 3. Fallback: Native browser speech synthesis strictly bound to Kannada phonetics
   */
  function speakWordPronunciation(kannadaText, translitText, btn) {
    stopAllSpeechAudio();

    // Clean text: strip English annotations, slashes, or notes
    const cleanKannada = (kannadaText || '').replace(/\(.*?\)/g, '').split('/')[0].trim();
    if (!cleanKannada) return;

    // Visual button feedback
    let resetBtn = null;
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.classList.add('mc-btn-speaking');
      btn.innerHTML = '<span>🔊 SPEAKING...</span>';

      resetBtn = () => {
        btn.classList.remove('mc-btn-speaking');
        btn.innerHTML = originalHtml;
      };

      setTimeout(() => {
        if (btn.classList.contains('mc-btn-speaking')) {
          resetBtn();
        }
      }, 5000);
    }

    // PRIMARY PATH: Authentic Native Local Kannada Female Audio Stream
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanKannada)}`;
    const audio = new Audio(audioUrl);
    activeAudioPlayer = audio;
    audio.playbackRate = 0.85; // Natural, clear, slow local cadence

    let hasStarted = false;

    audio.onended = () => {
      activeAudioPlayer = null;
      if (resetBtn) resetBtn();
    };

    audio.onerror = () => {
      if (!hasStarted) {
        fallbackToBrowserVoice(cleanKannada, resetBtn);
      } else if (resetBtn) {
        resetBtn();
      }
    };

    audio.play()
      .then(() => {
        hasStarted = true;
      })
      .catch((err) => {
        console.warn('[Audio /api/tts stream fallback]', err);
        fallbackToBrowserVoice(cleanKannada, resetBtn);
      });
  }

  function speakCropAudio(btn) {
    if (!activeInspectCrop) return;
    const knText = activeInspectCrop.kannada || '';
    const translitText = activeInspectCrop.translit || activeInspectCrop.pronunciation || activeInspectCrop.roman || activeInspectCrop.english || '';
    speakWordPronunciation(knText, translitText, btn);
  }

  window.speakWordPronunciation = speakWordPronunciation;
  window.playKannadaAudio = speakWordPronunciation;

  /**
   * Deterministic pseudo-random placement algorithm:
   * Distributes flowers naturally across the meadow canvas without hard blocks.
   * Avoids overlaps and assigns foreground/background perspective scales.
   */
  function getFlowerMeadowPosition(index, count, meadowHeight) {
    // 2-column alternating flow across horizontal meadow (col 0 = left, col 1 = right)
    const row = Math.floor(index / 2);
    const col = index % 2;

    // Deterministic pseudo-random based on index so positions are stable
    const seed1 = Math.sin((index + 1) * 31.4159) * 10000;
    const randX = seed1 - Math.floor(seed1);

    const seed2 = Math.cos((index + 1) * 47.1238) * 10000;
    const randY = seed2 - Math.floor(seed2);

    // Left position percentage
    let leftPercent;
    if (col === 0) {
      leftPercent = 18 + randX * 24; // 18% to 42%
    } else {
      leftPercent = 58 + randX * 26; // 58% to 84%
    }

    // Top position in pixels:
    // Starts at 75px, spaced ~135px down per row, with random vertical jitter +/- 28px
    const rowBase = 80 + row * 135;
    const topPx = Math.max(60, rowBase + (randY - 0.5) * 55);

    // Depth perspective: flowers lower down in foreground appear slightly larger
    const depthRatio = Math.min(1, topPx / Math.max(500, meadowHeight));
    const scale = 0.92 + depthRatio * 0.22; // 0.92 to 1.14

    return { leftPercent, topPx, scale };
  }

  function renderMinecraftGarden() {
    const meadowStage = document.getElementById('mc-meadow-stage');
    const field = document.getElementById('mc-flower-grid');
    const xpBadge = document.getElementById('mc-xp-badge');
    const statusEl = document.getElementById('mc-garden-status');
    if (!field) return;

    // Load words from GardenStore / localStorage
    const items = safeGetArray('nammooru_garden', 'nammooru_garden_v1');
    const count = items.length;
    const level = Math.floor(count / 2);

    // 1. Update XP Badge & Biome Status
    if (xpBadge) {
      xpBadge.textContent = `LVL ${level} • ${count} BLOOMED`;
    }

    if (statusEl) {
      if (count === 0) {
        statusEl.textContent = 'Meadow Quiet • Ready for Seeds';
      } else if (count < 4) {
        statusEl.textContent = `${count} Wildflower${count > 1 ? 's' : ''} Blooming • Biome Awakening`;
      } else {
        statusEl.textContent = `${count} Wildflowers Bloomed • Lush Meadow Sanctuary`;
      }
    }

    field.innerHTML = '';

    // 2. Dynamic Scrolling Height:
    // As flowers increase, the meadow becomes taller, giving users an expansive scrollable garden!
    const rows = Math.ceil(count / 2);
    const calculatedHeight = count === 0 ? 480 : Math.max(520, 320 + rows * 140);
    
    if (meadowStage) {
      meadowStage.style.minHeight = `${calculatedHeight}px`;
    }
    field.style.minHeight = `${calculatedHeight}px`;

    // 3. Empty State (0 Flowers)
    if (count === 0) {
      const emptySign = document.createElement('div');
      emptySign.className = 'mc-empty-meadow-sign';
      emptySign.innerHTML = `
        <div class="mc-sign-title">🌱 MEADOW READY</div>
        <p class="mc-sign-text">Snap photos in the Photo tab or explore words in Learn. Every discovered word will bloom as a living wildflower in your meadow!</p>
        <button type="button" class="mc-btn-snap" id="btn-mc-goto-photo">📸 SNAP FIRST FLOWER</button>
      `;

      field.appendChild(emptySign);

      const snapBtn = emptySign.querySelector('#btn-mc-goto-photo');
      if (snapBtn) {
        snapBtn.addEventListener('click', () => {
          closeWordGardenBiome();
          const photoTab = document.getElementById('tab-photo');
          if (photoTab) photoTab.click();
        });
      }
      return;
    }

    // 4. Render Bloomed Wildflowers scattered organically across the meadow
    items.forEach((item, index) => {
      const pos = getFlowerMeadowPosition(index, count, calculatedHeight);
      const flowerSvg = getMinecraftCropSvg(index);

      const flowerEl = document.createElement('div');
      flowerEl.className = 'mc-wildflower-item';
      flowerEl.setAttribute('role', 'button');
      flowerEl.setAttribute('tabindex', '0');
      flowerEl.setAttribute('aria-label', `Inspect wildflower ${item.english || 'word'}`);
      
      flowerEl.style.top = `${pos.topPx}px`;
      flowerEl.style.left = `${pos.leftPercent}%`;
      flowerEl.style.zIndex = `${Math.floor(pos.topPx)}`;
      flowerEl.style.transform = `translate(-50%, -100%) scale(${pos.scale.toFixed(2)})`;

      flowerEl.innerHTML = `
        <div class="mc-flower-bloom-anchor">
          <div class="mc-flower-graphic">
            ${flowerSvg}
          </div>
          <div class="mc-flower-shadow"></div>
        </div>
        <div class="mc-flower-nametag">
          <span class="mc-nametag-kn">${item.kannada || ''}</span>
          <span class="mc-nametag-en">${item.english || ''}</span>
        </div>
      `;

      // Click to open inspection dialog
      flowerEl.addEventListener('click', () => openInspectModal(item, flowerSvg));
      flowerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openInspectModal(item, flowerSvg);
        }
      });

      field.appendChild(flowerEl);
    });
  }

  // Bind Listeners for Word Garden Biome
  document.addEventListener('DOMContentLoaded', function () {
    const btnOpenGarden = document.getElementById('btn-open-word-garden');
    if (btnOpenGarden) {
      btnOpenGarden.addEventListener('click', openWordGardenBiome);
      btnOpenGarden.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openWordGardenBiome();
        }
      });
    }

    const btnOpenFromLearn = document.getElementById('btn-open-garden-from-learn');
    if (btnOpenFromLearn) {
      btnOpenFromLearn.addEventListener('click', openWordGardenBiome);
    }

    const btnBack = document.getElementById('btn-back-to-deck');
    if (btnBack) {
      btnBack.addEventListener('click', closeWordGardenBiome);
    }

    const inspectBackdrop = document.getElementById('mc-inspect-backdrop');
    if (inspectBackdrop) {
      inspectBackdrop.addEventListener('click', function (e) {
        if (e.target === inspectBackdrop) {
          closeInspectModal();
        }
      });
    }

    const btnCloseInspect = document.getElementById('btn-close-inspect');
    if (btnCloseInspect) {
      btnCloseInspect.addEventListener('click', function (e) {
        e.stopPropagation();
        closeInspectModal();
      });
    }

    const btnPronounce = document.getElementById('btn-mc-pronounce');
    if (btnPronounce) {
      btnPronounce.addEventListener('click', function (e) {
        e.stopPropagation();
        speakCropAudio(btnPronounce);
      });
    }

    // Keyboard support: Escape closes inspect dialog
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const backdrop = document.getElementById('mc-inspect-backdrop');
        if (backdrop && backdrop.style.display !== 'none') {
          closeInspectModal();
        }
      }
    });

    // Initialize Start Login Protocol
    initStartAuthGate();
  });

  // =========================================================================
  // START LOGIN PROTOCOL: GOOGLE OR EMAIL & PASSWORD
  // =========================================================================
  function initStartAuthGate() {
    const authGate = document.getElementById('app-auth-gate');
    const btnGoogle = document.getElementById('btn-google-login');
    const formEmail = document.getElementById('form-gate-auth');
    const tabSignIn = document.getElementById('tab-auth-signin');
    const tabSignUp = document.getElementById('tab-auth-signup');
    const gateEmail = document.getElementById('gate-email');
    const gatePassword = document.getElementById('gate-password');
    const btnSubmit = document.getElementById('btn-gate-submit');
    const btnSubmitText = document.getElementById('btn-gate-submit-text');
    const btnGuest = document.getElementById('btn-gate-guest');
    const gateAlert = document.getElementById('auth-gate-alert');
    const btnSignOut = document.getElementById('btn-app-logout');

    const profileName = document.getElementById('profile-display-name');
    const profileInitials = document.getElementById('profile-avatar-initials');
    const profile2FaText = document.getElementById('profile-2fa-text');

    if (!authGate) return;

    let isSignUpMode = false;

    function getSession() {
      try {
        const raw = localStorage.getItem('nammooru_auth_session');
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    function saveSession(session) {
      try {
        localStorage.setItem('nammooru_auth_session', JSON.stringify(session));
      } catch (_) {}
    }

    function showAlert(msg, isError = true) {
      if (!gateAlert) return;
      gateAlert.textContent = msg;
      gateAlert.className = isError ? 'auth-gate-alert error' : 'auth-gate-alert success';
      gateAlert.style.display = 'block';
    }

    function hideAlert() {
      if (gateAlert) gateAlert.style.display = 'none';
    }

    function syncProfileUI(session) {
      if (!session) return;
      if (profileName && session.name) {
        profileName.textContent = session.name;
      }
      if (profileInitials && session.avatar) {
        profileInitials.textContent = session.avatar;
      }
      if (profile2FaText) {
        if (session.method === 'google') {
          profile2FaText.textContent = 'Google Connected';
        } else if (session.method === 'email') {
          profile2FaText.textContent = 'Email Verified';
        } else {
          profile2FaText.textContent = 'Guest Explorer';
        }
      }
    }

    function unlockApp(session) {
      saveSession(session);
      syncProfileUI(session);
      hideAlert();
      authGate.style.display = 'none';
      document.body.style.overflow = '';
    }

    function lockApp() {
      try {
        localStorage.removeItem('nammooru_auth_session');
      } catch (_) {}
      if (gateEmail) gateEmail.value = '';
      if (gatePassword) gatePassword.value = '';
      hideAlert();
      authGate.style.display = 'flex';
    }

    // 1. Initial State Check
    const activeSession = getSession();
    if (activeSession && activeSession.isLoggedIn) {
      authGate.style.display = 'none';
      syncProfileUI(activeSession);
    } else {
      authGate.style.display = 'flex';
    }

    // 2. Tab Switcher
    if (tabSignIn && tabSignUp) {
      tabSignIn.addEventListener('click', () => {
        isSignUpMode = false;
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        tabSignIn.setAttribute('aria-selected', 'true');
        tabSignUp.setAttribute('aria-selected', 'false');
        if (btnSubmitText) btnSubmitText.textContent = 'Sign In →';
        hideAlert();
      });

      tabSignUp.addEventListener('click', () => {
        isSignUpMode = true;
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        tabSignUp.setAttribute('aria-selected', 'true');
        tabSignIn.setAttribute('aria-selected', 'false');
        if (btnSubmitText) btnSubmitText.textContent = 'Create Account →';
        hideAlert();
      });
    }

    // 3. Connect with Google
    if (btnGoogle) {
      btnGoogle.addEventListener('click', () => {
        const origContent = btnGoogle.innerHTML;
        btnGoogle.innerHTML = '<span>Connecting to Google...</span>';
        btnGoogle.disabled = true;

        setTimeout(() => {
          btnGoogle.innerHTML = origContent;
          btnGoogle.disabled = false;
          const session = {
            isLoggedIn: true,
            method: 'google',
            email: 'bengaluru.explorer@gmail.com',
            name: 'Bengaluru Explorer',
            avatar: 'BE',
            loggedInAt: new Date().toISOString()
          };
          showAlert('Connected with Google! Welcome to Nammooru.', false);
          setTimeout(() => unlockApp(session), 350);
        }, 500);
      });
    }

    // 4. Email & Password Form Submit
    if (formEmail) {
      formEmail.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (gateEmail?.value || '').trim();
        const password = (gatePassword?.value || '').trim();

        if (!email || !email.includes('@') || !email.includes('.')) {
          showAlert('Please enter a valid email address.');
          if (gateEmail) gateEmail.focus();
          return;
        }

        if (!password || password.length < 4) {
          showAlert('Password must be at least 4 characters.');
          if (gatePassword) gatePassword.focus();
          return;
        }

        const userPrefix = email.split('@')[0];
        const formattedName = userPrefix.charAt(0).toUpperCase() + userPrefix.slice(1);
        const initials = formattedName.slice(0, 2).toUpperCase();

        const session = {
          isLoggedIn: true,
          method: 'email',
          email: email,
          name: formattedName,
          avatar: initials,
          loggedInAt: new Date().toISOString()
        };

        showAlert(isSignUpMode ? 'Account created! Welcome to Nammooru.' : 'Signed in successfully!', false);
        setTimeout(() => unlockApp(session), 350);
      });
    }

    // 5. Continue as Guest
    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        const session = {
          isLoggedIn: true,
          method: 'guest',
          email: 'guest@nammooru.app',
          name: 'Guest Explorer',
          avatar: 'GE',
          loggedInAt: new Date().toISOString()
        };
        unlockApp(session);
      });
    }

    // 6. Sign Out
    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        lockApp();
      });
    }

    window.lockAppToLogin = lockApp;
  }

  // Expose Globally
  window.openWordGardenBiome = openWordGardenBiome;
  window.closeWordGardenBiome = closeWordGardenBiome;
  window.renderMinecraftGarden = renderMinecraftGarden;

  // React to Storage Changes
  window.addEventListener('storage', function (e) {
    if (e.key === 'nammooru_garden' || e.key === 'nammooru_garden_v1') {
      const garden = document.getElementById('word-garden-container');
      if (garden && garden.style.display !== 'none') {
        renderMinecraftGarden();
      }
    }
  });

})();
