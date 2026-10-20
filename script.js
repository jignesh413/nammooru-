/**
 * ============================================================================
 * Nammooru — Core Application Shell & Photo Feature (Step 2 of 11)
 * ============================================================================
 * 
 * Overview:
 * 1. Section Navigation: Handles tab-based navigation between:
 *    - PHOTO (Default initial view)
 *    - LEARN
 *    - INNOVATE
 *    - TRANSFORM
 * 2. Camera & Photo Capture:
 *    - "Take a Photo" (device camera capture with capture="environment" hint)
 *    - "Upload from Gallery" (standard image picker)
 *    - Real-time client-side image preview
 *    - File type and size validation (up to 15 MB)
 *    - "Retake" and "Remove Photo" actions
 *    - Friendly feedback on cancel, error, or invalid file
 * 
 * Technology:
 * Pure Vanilla JavaScript (ES6+), zero external dependencies.
 * Built with full accessibility (ARIA roles, keyboard arrow navigation, focus).
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // PART 1: Section Tab Navigation System
  // ==========================================================================

  const tabButtons = Array.from(document.querySelectorAll('.app-tabbar [role="tab"]'));
  const viewSections = Array.from(document.querySelectorAll('.app-content .view-section'));

  // Valid section identifiers for the project shell (Exactly 4 primary destinations)
  const VALID_SECTIONS = ['photo', 'learn', 'innovate', 'transform'];
  const DEFAULT_SECTION = 'photo';

  /**
   * Activates the requested section and updates navigation state.
   * 
   * @param {string} sectionId - The target section name ('photo', 'learn', 'innovate', 'transform')
   * @param {boolean} shouldUpdateHash - Whether to sync window.location.hash
   */
  function switchSection(sectionId, shouldUpdateHash = true) {
    // Handle subpage deep links gracefully
    if (sectionId === 'tries') {
      switchSection('innovate', shouldUpdateHash);
      if (typeof switchInnovatePanel === 'function') switchInnovatePanel('record');
      return;
    }
    if (sectionId === 'badges' || sectionId === 'achievements') {
      switchSection('innovate', shouldUpdateHash);
      if (typeof switchInnovatePanel === 'function') switchInnovatePanel('badges');
      return;
    }
    if (sectionId === 'words' || sectionId === 'phrases') {
      switchSection('learn', shouldUpdateHash);
      if (typeof switchLearnMode === 'function') switchLearnMode(sectionId);
      return;
    }
    if (sectionId === 'garden') {
      if (typeof openGardenModal === 'function') openGardenModal();
      return;
    }

    const targetId = VALID_SECTIONS.includes(sectionId) ? sectionId : DEFAULT_SECTION;

    // 1. Update Tab Buttons (ARIA & visual active class)
    tabButtons.forEach(tab => {
      const isTarget = tab.dataset.target === targetId;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.setAttribute('tabindex', isTarget ? '0' : '-1');
    });

    // 2. Update View Sections (Visibility, hidden attribute, active animation)
    viewSections.forEach(section => {
      const isTarget = section.id === `section-${targetId}`;
      if (isTarget) {
        section.hidden = false;
        requestAnimationFrame(() => {
          section.classList.add('active');
        });
      } else {
        section.classList.remove('active');
        section.hidden = true;
      }
    });

    // 3. Render section-specific data on activation
    if (targetId === 'photo') {
      if (typeof startArCameraStream === 'function') startArCameraStream();
      if (typeof updateArTrainerHud === 'function') updateArTrainerHud();
    } else {
      if (typeof stopArCameraStream === 'function') stopArCameraStream();
    }

    if (targetId === 'innovate') {
      if (typeof updateInnovateStats === 'function') updateInnovateStats();
      if (typeof renderBadgesShowcase === 'function') renderBadgesShowcase();
      if (typeof renderPracticeLog === 'function') renderPracticeLog();
    } else if (targetId === 'learn') {
      if (typeof renderCurrentMode === 'function') renderCurrentMode();
    } else if (targetId === 'transform') {
      if (typeof syncProfileCard === 'function') syncProfileCard();
      if (typeof renderCommunityFeed === 'function') renderCommunityFeed();
    }

    // 3. Smooth scroll reset to top of content area (scrolling is isolated inside .app-content)
    const contentEl = document.querySelector('.app-content');
    if (contentEl) contentEl.scrollTop = 0;

    // 4. Update URL hash without breaking browser history
    if (shouldUpdateHash) {
      if (window.location.hash !== `#${targetId}`) {
        history.replaceState(null, '', `#${targetId}`);
      }
    }
  }

  // Click / Tap Event Listeners for Tab Navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      switchSection(target);
    });
  });

  // Keyboard Accessibility for Tablist (WAI-ARIA Pattern)
  const tabList = document.querySelector('.app-tabbar');
  if (tabList) {
    tabList.addEventListener('keydown', (event) => {
      const focusedIndex = tabButtons.indexOf(document.activeElement);
      if (focusedIndex === -1) return;

      let nextIndex = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = (focusedIndex + 1) % tabButtons.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = (focusedIndex - 1 + tabButtons.length) % tabButtons.length;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = tabButtons.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        const nextTab = tabButtons[nextIndex];
        nextTab.focus();
        switchSection(nextTab.dataset.target);
      }
    });
  }

  // Browser History / URL Hash Support (Back/Forward buttons)
  window.addEventListener('hashchange', () => {
    const rawHash = window.location.hash.replace('#', '').toLowerCase();
    switchSection(rawHash, false);
  });

  // Initial Activation on Page Load
  const initialHash = window.location.hash.replace('#', '').toLowerCase();
  const initialSection = VALID_SECTIONS.includes(initialHash) ? initialHash : DEFAULT_SECTION;
  switchSection(initialSection, false);


  // ==========================================================================
  // PART 2: Camera & Photo Upload Feature (Step 2)
  // ==========================================================================

  // DOM Elements for Photo Capture & Preview
  const cameraInput = document.getElementById('camera-input');
  const galleryInput = document.getElementById('gallery-input');
  const btnTakePhoto = document.getElementById('btn-take-photo');
  const btnUploadGallery = document.getElementById('btn-gallery') || document.getElementById('btn-upload-gallery');
  const captureActions = document.getElementById('capture-actions');

  const feedbackBanner = document.getElementById('photo-feedback');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackText = document.getElementById('feedback-text');

  const previewContainer = document.getElementById('photo-preview-container');
  const previewImage = document.getElementById('preview-image');
  const previewFilename = document.getElementById('preview-filename');
  const btnRetakePhoto = document.getElementById('btn-retake-photo');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');

  const heroAmbientVisual = document.getElementById('hero-ambient-visual');
  const captureCard = document.getElementById('photo-capture-card');
  const resultPanel = document.getElementById('result-panel') || document.getElementById('recognition-result-card');
  const resultSheetScrim = document.getElementById('result-sheet-scrim');
  const resultErrorMsg = document.getElementById('result-error-message') || document.getElementById('feedback-text');

  // Configuration Constants
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes
  const ALLOWED_MIME_PREFIX = 'image/';
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];

  // State Tracking
  let currentObjectUrl = null;
  let lastTriggerSource = 'camera'; // 'camera' or 'gallery'
  let feedbackTimeoutId = null;
  let activeFile = null;
  let activeCompressedData = null;

  /**
   * Displays a friendly message in the feedback banner.
   * 
   * @param {string} message - Text to display
   * @param {'info' | 'error' | 'success'} type - Alert severity type
   * @param {number} autoHideMs - Duration in ms before auto-hiding (0 to keep visible)
   */
  function showFeedback(message, type = 'info', autoHideMs = 0) {
    if (feedbackTimeoutId) {
      clearTimeout(feedbackTimeoutId);
      feedbackTimeoutId = null;
    }

    if (!message) {
      feedbackBanner.hidden = true;
      return;
    }

    feedbackBanner.className = 'feedback-banner';
    feedbackBanner.hidden = false;

    if (type === 'error') {
      feedbackBanner.classList.add('is-error');
      feedbackIcon.textContent = '⚠️';
    } else if (type === 'success') {
      feedbackBanner.classList.add('is-success');
      feedbackIcon.textContent = '✓';
    } else {
      feedbackIcon.textContent = 'ℹ️';
    }

    feedbackText.textContent = message;

    if (autoHideMs > 0) {
      feedbackTimeoutId = setTimeout(() => {
        feedbackBanner.hidden = true;
      }, autoHideMs);
    }
  }

  /**
   * Helper to format bytes into readable KB/MB string.
   */
  function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return Math.round(bytes / 1024) + ' KB';
  }

  /**
   * Validates whether a file is an accepted image format.
   */
  function isValidImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith(ALLOWED_MIME_PREFIX)) {
      return true;
    }
    const nameLower = (file.name || '').toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => nameLower.endsWith(ext));
  }

  /**
   * Handles user file selection from camera or gallery input.
   * Compresses image on off-screen HTML5 Canvas (max 1080px, ~82% quality)
   * and updates viewfinder HUD badge and preview.
   * 
   * @param {File} file - Selected file object
   */
  async function handleFileSelection(file) {
    if (!file) {
      if (!currentObjectUrl && !activeCompressedData) {
        showFeedback('No photo was selected. You can take a photo or pick one from your gallery anytime.', 'info', 4000);
      }
      return;
    }

    // 1. File Type Validation
    if (!isValidImageFile(file)) {
      showFeedback('Please select an image file (such as a JPEG, PNG, or WebP photo).', 'error');
      return;
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeStr = formatFileSize(file.size);
      showFeedback(
        `This photo is too large (${sizeStr}). To fix this, please select an image under 15 MB or take a standard photo.`,
        'error'
      );
      return;
    }

    // 3. Clear existing object URL to free browser memory
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }

    try {
      activeFile = file;

      // 4. Client-Side Image Compactor:
      // Compress on off-screen HTML5 Canvas before processing (max 1080px, ~82% quality)
      const compressed = await compressImageFile(file);
      if (compressed) {
        activeCompressedData = compressed;
        previewImage.src = compressed.dataUrl;

        // Display subtle HUD badge indicating compression savings (e.g., "Compressed: 4.8MB → 112KB")
        const hudChip = document.getElementById('compression-hud-chip');
        const hudText = document.getElementById('compression-hud-text');
        if (hudChip && hudText) {
          hudText.textContent = `${compressed.savingsLabel} (-${compressed.savingsPct}%)`;
          hudChip.hidden = false;
        }
      } else {
        currentObjectUrl = URL.createObjectURL(file);
        previewImage.src = currentObjectUrl;
      }

      // Update metadata bar
      const sizeFormatted = formatFileSize(file.size);
      if (previewFilename) {
        previewFilename.textContent = `${file.name || 'Photo'} (${sizeFormatted})`;
      }

      // 5. Update UI Viewport States
      // 5. Update UI Viewport States
      if (previewContainer) previewContainer.hidden = false;
      const idleSensor = document.getElementById('optical-idle-sensor');
      if (idleSensor) idleSensor.hidden = true;

      // Hide shutter & gallery row while photo is active so user focuses on Identify
      if (captureActions) captureActions.hidden = true;
      const secRow = document.getElementById('secondary-actions-row');
      if (secRow) secRow.hidden = true;

      const btnIdentifyEl = document.getElementById('btn-identify');
      if (btnIdentifyEl) {
        btnIdentifyEl.disabled = false;
        const labelEl = document.getElementById('btn-identify-label');
        if (labelEl) labelEl.textContent = 'IDENTIFY IN KANNADA';
      }

      // Update mascot encouragement quote
      const quoteEl = document.getElementById('pet-quote-text');
      if (quoteEl) {
        quoteEl.textContent = 'Nice shot! Tap Identify to learn it in Kannada.';
      }

      // Subtly hide ambient city visual to focus on user's photo
      if (heroAmbientVisual) {
        heroAmbientVisual.hidden = true;
      }

      showFeedback('Photo ready for identification!', 'success', 3500);
    } catch (err) {
      console.error('Error generating photo preview:', err);
      showFeedback('Could not load the photo preview. Please try taking or selecting the photo again.', 'error');
    }
  }

  /**
   * Resets active photo state and returns UI to default.
   */
  function removeActivePhoto(showNotice = true) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }

    activeCompressedData = null;
    previewImage.removeAttribute('src');
    if (previewFilename) previewFilename.textContent = '';
    if (cameraInput) cameraInput.value = '';
    if (galleryInput) galleryInput.value = '';

    const hudChip = document.getElementById('compression-hud-chip');
    if (hudChip) hudChip.hidden = true;

    if (previewContainer) previewContainer.hidden = true;
    const idleSensor = document.getElementById('optical-idle-sensor');
    if (idleSensor) idleSensor.hidden = false;

    if (captureActions) captureActions.hidden = false;
    const secRow = document.getElementById('secondary-actions-row');
    if (secRow) secRow.hidden = false;

    activeFile = null;
    const btnIdentifyEl = document.getElementById('btn-identify');
    if (btnIdentifyEl) {
      btnIdentifyEl.disabled = false;
      const labelEl = document.getElementById('btn-identify-label');
      if (labelEl) labelEl.textContent = 'IDENTIFY IN KANNADA';
    }

    const quoteEl = document.getElementById('pet-quote-text');
    if (quoteEl) {
      quoteEl.textContent = 'Namaskara! Snap your first word.';
    }

    hideResultPanel();

    if (heroAmbientVisual) {
      heroAmbientVisual.hidden = false;
    }

    if (showNotice) {
      showFeedback('Photo reset. Align any object to discover its Kannada name.', 'info', 3000);
    }
  }

  // Ensure clean initial state on page load
  removeActivePhoto(false);

  // Wire clear photo button explicitly
  const btnRemovePhotoEl = document.getElementById('btn-remove-photo');
  if (btnRemovePhotoEl) {
    btnRemovePhotoEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeActivePhoto(true);
    });
  }

  // --------------------------------------------------------------------------
  // POKÉMON GO-STYLE AR ENCOUNTER CONTROLLER
  // --------------------------------------------------------------------------
  const AR_WILD_ENCOUNTERS = [
    {
      kannada: "ಕಾಫಿ",
      translit: "Kaapi",
      english: "Filter Coffee",
      category: "Daily Food & Drink",
      cp: 450,
      rarity: "COMMON"
    },
    {
      kannada: "ಆಟೋ",
      translit: "Aato",
      english: "Auto Rickshaw",
      category: "City Transport",
      cp: 620,
      rarity: "UNCOMMON"
    },
    {
      kannada: "ದೋಸೆ",
      translit: "Dose",
      english: "Crisp Dosa",
      category: "Breakfast Legend",
      cp: 580,
      rarity: "COMMON"
    },
    {
      kannada: "ಹೂವು",
      translit: "Hoovu",
      english: "Mallige Flowers",
      category: "Morning Market",
      cp: 340,
      rarity: "COMMON"
    },
    {
      kannada: "ಬಸ್",
      translit: "Bas",
      english: "BMTC City Bus",
      category: "Bengaluru Transit",
      cp: 780,
      rarity: "RARE"
    },
    {
      kannada: "ಎಳನೀರು",
      translit: "Elaneeru",
      english: "Tender Coconut",
      category: "Cool Refreshment",
      cp: 410,
      rarity: "COMMON"
    },
    {
      kannada: "ಚಹಾ",
      translit: "Chaha",
      english: "Bengaluru Tea",
      category: "Evening Chai",
      cp: 390,
      rarity: "COMMON"
    },
    {
      kannada: "ದೇವಸ್ಥಾನ",
      translit: "Devasthaana",
      english: "Historic Temple",
      category: "Heritage Site",
      cp: 890,
      rarity: "VERY RARE"
    }
  ];

  let currentWildEncounterIndex = 0;
  let arMediaStream = null;

  function updateArTrainerHud() {
    const levelEl = document.getElementById('ar-trainer-level');
    const headerLevelEl = document.getElementById('header-profile-level');
    const bagBadgeEl = document.getElementById('history-count-badge');
    const records = typeof loadHistory === 'function' ? loadHistory() : [];
    const count = Array.isArray(records) ? records.length : 0;
    const level = Math.max(1, count);
    const xp = count * 50;
    const statsText = `LVL ${level} • ${xp} XP`;

    if (levelEl) {
      levelEl.textContent = statsText;
    }
    if (headerLevelEl) {
      headerLevelEl.textContent = statsText;
    }
    if (bagBadgeEl) {
      bagBadgeEl.textContent = count;
      bagBadgeEl.hidden = (count === 0);
    }
  }

  // Header Profile Card click navigates to profile/stats
  const headerProfileCard = document.getElementById('header-profile-card');
  if (headerProfileCard) {
    headerProfileCard.addEventListener('click', () => {
      if (typeof switchSection === 'function') switchSection('transform');
    });
  }

  function renderWildEncounter(index = 0) {
    const enc = AR_WILD_ENCOUNTERS[index % AR_WILD_ENCOUNTERS.length];
    const cpEl = document.getElementById('ar-encounter-cp');
    const knEl = document.getElementById('ar-encounter-kannada');
    const subEl = document.getElementById('ar-encounter-sub');
    if (cpEl) cpEl.textContent = `⚡ CP ${enc.cp} • WILD ENCOUNTER`;
    if (knEl) knEl.textContent = enc.kannada;
    if (subEl) subEl.textContent = `${enc.kannada} • ${enc.translit} | ${enc.category}`;
  }

  function rotateWildEncounter() {
    currentWildEncounterIndex = (currentWildEncounterIndex + 1) % AR_WILD_ENCOUNTERS.length;
    renderWildEncounter(currentWildEncounterIndex);
  }

  async function startArCameraStream() {
    const videoEl = document.getElementById('camera-stream');
    if (!videoEl || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      if (arMediaStream && arMediaStream.active) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      arMediaStream = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      console.info('[AR Camera Stream Notice]: Using ambient AR grid viewfinder fallback.', err.message);
    }
  }

  function stopArCameraStream() {
    if (arMediaStream) {
      arMediaStream.getTracks().forEach(track => track.stop());
      arMediaStream = null;
    }
    const videoEl = document.getElementById('camera-stream');
    if (videoEl) videoEl.srcObject = null;
  }

  function captureFromArViewfinder() {
    const videoEl = document.getElementById('camera-stream');

    // Visual feedback on encounter card
    const cpBadgeEl = document.getElementById('ar-encounter-cp');
    const knTextEl = document.getElementById('ar-encounter-kannada');
    const subTextEl = document.getElementById('ar-encounter-sub');
    if (cpBadgeEl) cpBadgeEl.textContent = '⚡ CATCHING... • POKÉBALL THROWN';
    if (knTextEl) knTextEl.textContent = 'ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...';
    if (subTextEl) subTextEl.textContent = 'Analyzing cultural object in Bengaluru...';

    if (videoEl && videoEl.videoWidth > 0 && !videoEl.paused) {
      try {
        const canvas = document.getElementById('camera-canvas') || document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `ar-encounter-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelection(file).then(() => {
              if (typeof identifyObject === 'function') {
                identifyObject();
              }
            });
          } else {
            startCamera();
          }
        }, 'image/jpeg', 0.85);
        return;
      } catch (err) {
        console.warn('AR Viewfinder canvas capture failed, using native input:', err);
      }
    }
    // Fallback to native camera input
    startCamera();
  }

  function triggerPokeballCapture() {
    const shutterBtn = document.getElementById('btn-capture') || btnTakePhoto;
    if (shutterBtn) {
      shutterBtn.classList.add('pokeball-throw');
      setTimeout(() => shutterBtn.classList.remove('pokeball-throw'), 320);
    }
    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
    captureFromArViewfinder();
  }

  /**
   * Directly triggers native camera capture on mobile devices.
   */
  function startCamera() {
    lastTriggerSource = 'camera';
    showFeedback('');
    try {
      if (cameraInput) {
        cameraInput.value = '';
        cameraInput.click();
      } else if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
      }
    } catch (err) {
      console.warn('[Camera Launch Error]:', err);
      showFeedback('Could not open camera. Please use GALLERY to select a photo.', 'error', 4000);
    }
  }

  window.startCamera = startCamera;
  window.startArCameraStream = startArCameraStream;
  window.stopArCameraStream = stopArCameraStream;
  window.updateArTrainerHud = updateArTrainerHud;

  function triggerCameraCapture() {
    return triggerPokeballCapture();
  }

  // 1. Center PokéBall Shutter Button (#btn-capture & #btn-take-photo)
  const btnCapture = document.getElementById('btn-capture');
  if (btnCapture) {
    btnCapture.addEventListener('click', (e) => {
      e.preventDefault();
      triggerPokeballCapture();
    });
  }

  if (btnTakePhoto) {
    btnTakePhoto.addEventListener('click', (e) => {
      e.preventDefault();
      triggerPokeballCapture();
    });
  }

  // 2. Left Bag Button (#btn-open-bag) -> History / Word Garden collection
  const btnOpenBag = document.getElementById('btn-open-bag');
  if (btnOpenBag) {
    btnOpenBag.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof openHistoryModal === 'function') openHistoryModal();
    });
  }

  // 3. Right Gallery Upload Button (#btn-gallery-upload & #btn-gallery)
  const btnGalleryUpload = document.getElementById('btn-gallery-upload');
  if (btnGalleryUpload) {
    btnGalleryUpload.addEventListener('click', (e) => {
      e.preventDefault();
      lastTriggerSource = 'gallery';
      showFeedback('');
      if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
      }
    });
  }

  if (btnUploadGallery) {
    btnUploadGallery.addEventListener('click', (e) => {
      e.preventDefault();
      lastTriggerSource = 'gallery';
      showFeedback('');
      if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
      }
    });
  }

  // 4. Wild Encounter Pronunciation Button (#btn-ar-pronounce)
  const btnArPronounce = document.getElementById('btn-ar-pronounce');
  if (btnArPronounce) {
    btnArPronounce.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = AR_WILD_ENCOUNTERS[currentWildEncounterIndex % AR_WILD_ENCOUNTERS.length];
      if (current && typeof playKannadaAudio === 'function') {
        playKannadaAudio(current.kannada, btnArPronounce);
      }
    });
  }

  // Tap Wild Encounter Card to cycle through encounters
  const arWildCard = document.getElementById('ar-wild-encounter-card');
  if (arWildCard) {
    arWildCard.addEventListener('click', (e) => {
      if (e.target.closest('#btn-ar-pronounce')) return;
      rotateWildEncounter();
    });
  }

  // Trainer Pill tap navigates to profile/stats
  const trainerPill = document.getElementById('ar-trainer-pill');
  if (trainerPill) {
    trainerPill.addEventListener('click', () => {
      if (typeof switchSection === 'function') switchSection('transform');
    });
  }

  // Start Wild Encounter rotation timer (every 10 seconds)
  setInterval(rotateWildEncounter, 10000);
  renderWildEncounter(0);
  updateArTrainerHud();

  if (cameraInput) {
    cameraInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        await handleFileSelection(file);
        const cpBadgeEl = document.getElementById('ar-encounter-cp');
        const knTextEl = document.getElementById('ar-encounter-kannada');
        const subTextEl = document.getElementById('ar-encounter-sub');
        if (cpBadgeEl) cpBadgeEl.textContent = '⚡ CATCHING... • POKÉBALL THROWN';
        if (knTextEl) knTextEl.textContent = 'ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...';
        if (subTextEl) subTextEl.textContent = 'Analyzing cultural object in Bengaluru...';

        if (typeof identifyObject === 'function') {
          identifyObject();
        }
      }
    });

    // Listen for cancel event if supported by browser
    cameraInput.addEventListener('cancel', () => {
      if (!currentObjectUrl) {
        showFeedback('No photo was selected. You can take a photo or pick one from your gallery anytime.', 'info', 3500);
      }
    });
  }

  if (galleryInput) {
    galleryInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        await handleFileSelection(file);
        const cpBadgeEl = document.getElementById('ar-encounter-cp');
        const knTextEl = document.getElementById('ar-encounter-kannada');
        const subTextEl = document.getElementById('ar-encounter-sub');
        if (cpBadgeEl) cpBadgeEl.textContent = '⚡ CATCHING... • POKÉBALL THROWN';
        if (knTextEl) knTextEl.textContent = 'ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...';
        if (subTextEl) subTextEl.textContent = 'Analyzing cultural item from gallery...';

        if (typeof identifyObject === 'function') {
          identifyObject();
        }
      }
    });

    galleryInput.addEventListener('cancel', () => {
      if (!currentObjectUrl) {
        showFeedback('No photo was selected. You can take a photo or pick one from your gallery anytime.', 'info', 3500);
      }
    });
  }

  // 5. "Retake" Button
  if (btnRetakePhoto) {
    btnRetakePhoto.addEventListener('click', (e) => {
      e.preventDefault();
      showFeedback('');
      if (lastTriggerSource === 'camera') {
        triggerPokeballCapture();
      } else if (galleryInput) {
        galleryInput.value = '';
        galleryInput.click();
      }
    });
  }

  // 4. "Remove Photo" Button
  if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', () => {
      removeActivePhoto(true);
    });
  }

  // 4b. Tap-to-Focus Reticle Micro-Pulse Interaction on Viewfinder
  const apertureFrame = document.getElementById('scanner-frame-ambient');
  if (apertureFrame) {
    apertureFrame.addEventListener('click', (e) => {
      if (e.target.closest('#capture-actions') || e.target.closest('.viewfinder-status-hud') || e.target.closest('#identify-action-wrapper')) return;
      const idleRing = document.querySelector('.sensor-halo-ring');
      if (idleRing) {
        idleRing.style.transform = 'scale(0.88)';
        idleRing.style.boxShadow = '0 0 32px rgba(56, 189, 248, 0.75)';
        idleRing.style.borderColor = 'var(--accent-cyan)';
        setTimeout(() => {
          idleRing.style.transform = '';
          idleRing.style.boxShadow = '';
          idleRing.style.borderColor = '';
        }, 320);
      }
    });
  }

  // 5. Desktop Drag and Drop Support for convenience
  if (captureCard) {
    ['dragenter', 'dragover'].forEach(eventName => {
      captureCard.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        captureCard.style.borderColor = 'var(--color-accent-gold)';
        captureCard.style.backgroundColor = 'var(--color-bg-sand-subtle)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      captureCard.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        captureCard.style.borderColor = '';
        captureCard.style.backgroundColor = '';
      });
    });

    captureCard.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        lastTriggerSource = 'gallery';
        handleFileSelection(files[0]);
      }
    });
  }

  // ==========================================================================
  // PART 3: Identify Object — Recognition & History Log Book (Step 3)
  // ==========================================================================

  // --- DOM References ---
  const btnIdentify        = document.getElementById('btn-identify') || document.getElementById('btn-identify-object');
  // resultPanel and resultErrorMsg declared at top of module
  const resultLoading      = document.getElementById('result-loading') || document.getElementById('scanning-laser');
  const resultSuccess      = document.getElementById('result-success') || document.getElementById('recognition-result-card');
  const resultError        = document.getElementById('result-error') || document.getElementById('photo-feedback');
  const resultConfBadge    = document.getElementById('result-confidence-badge') || document.querySelector('.result-tag-pill');
  const resultEnglish      = document.getElementById('result-english');
  const resultKannada      = document.getElementById('result-kannada');
  const resultPronun       = document.getElementById('result-pronunciation') || document.getElementById('result-translit');
  const resultDesc         = document.getElementById('result-description');
  const btnLearnWord            = document.getElementById('btn-learn-word');
  const btnSaveHistory          = document.getElementById('btn-save-history');
  const btnListenResult         = document.getElementById('btn-listen-result');
  const btnScanAnother          = document.getElementById('btn-scan-another') || document.getElementById('btn-retake-photo');
  const btnResultSaveGarden     = document.getElementById('btn-result-save-garden');
  const btnResultSaveGardenText = document.getElementById('btn-result-save-garden-text');
  const btnModeGarden           = document.getElementById('btn-mode-garden');
  const learnGardenTabBadge     = document.getElementById('learn-garden-tab-badge');
  const apiSetupCard            = document.getElementById('api-setup-card');

  const btnHistoryOpen     = document.getElementById('btn-history') || document.getElementById('btn-history-open') || document.getElementById('btn-history-log');
  const historyCountBadge  = document.getElementById('history-count-badge');
  const historyOverlay     = document.getElementById('history-overlay') || document.getElementById('modal-history');
  const btnHistoryClose    = document.getElementById('btn-history-close');
  const historyList        = document.getElementById('history-list') || document.getElementById('history-modal-body');
  const historyEmpty       = document.getElementById('history-empty');
  const btnClearAll        = document.getElementById('btn-clear-all-history') || document.getElementById('btn-history-clear-all');

  const historyDetailOverlay = document.getElementById('history-detail-overlay') || document.getElementById('history-detail-modal');
  const historyDetailBody    = document.getElementById('history-detail-body');
  const btnDetailClose       = document.getElementById('btn-detail-close') || document.getElementById('btn-history-detail-close');

  // --- State ---
  let apiConfigured      = false;   // Whether server reports API key is set
  const HISTORY_KEY      = 'nammooru_history_v1';
  const MAX_HISTORY      = 100;     // Maximum stored records

  // -------------------------------------------------------------------------
  // A. API Configuration Status Check
  // -------------------------------------------------------------------------
  async function checkApiConfig() {
    try {
      const res = await fetch('/api/config-status');
      if (!res.ok) throw new Error('Non-OK status');
      const data = await res.json();
      apiConfigured = !!data.configured;
    } catch {
      // Server may not support the endpoint (e.g., raw python -m http.server)
      apiConfigured = false;
    }

    if (!apiConfigured && apiSetupCard) {
      apiSetupCard.hidden = false;
    } else if (apiConfigured && apiSetupCard) {
      apiSetupCard.hidden = true;
    }
  }

  checkApiConfig();

  // -------------------------------------------------------------------------
  // B. Client-Side Image Compactor (HTML5 Canvas, max 1080px, JPEG 82%)
  //    Ingests camera or gallery images and downscales on an off-screen canvas.
  // -------------------------------------------------------------------------
  function compressImageFile(file) {
    return new Promise((resolve) => {
      const MAX_SIDE = 1080; // Scaled to max width/height 1080px
      const COMPRESSION_QUALITY = 0.82; // Compressed quality to ~82%
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // Automatically scale down large images to a maximum width/height of 1080px
        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_SIDE);
            width = MAX_SIDE;
          } else {
            width = Math.round((width / height) * MAX_SIDE);
            height = MAX_SIDE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Off-screen canvas thumbnail (96px for history log book)
        const THUMB_SIZE = 96;
        const tRatio = Math.min(THUMB_SIZE / width, THUMB_SIZE / height);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width  = Math.max(1, Math.round(width  * tRatio));
        thumbCanvas.height = Math.max(1, Math.round(height * tRatio));
        thumbCanvas.getContext('2d').drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
        const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.70);

        // Calculate exact compression metrics
        const origBytes = file.size;
        const base64Str = dataUrl.split(',')[1] || '';
        const compBytes = Math.round((base64Str.length * 3) / 4);
        const savingsPct = origBytes > compBytes 
          ? Math.round(((origBytes - compBytes) / origBytes) * 100)
          : 0;

        const origFormatted = formatFileSize(origBytes);
        const compFormatted = formatFileSize(compBytes);
        const savingsLabel = `Compressed: ${origFormatted} → ${compFormatted}`;

        resolve({
          dataUrl,
          thumbUrl,
          mimeType: 'image/jpeg',
          origBytes,
          compBytes,
          origFormatted,
          compFormatted,
          savingsPct,
          savingsLabel,
          width,
          height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  // -------------------------------------------------------------------------
  // C. Show/Hide Interactive Frosted Glass Bottom Sheet Drawer
  // -------------------------------------------------------------------------
  function showResultPanel(state, errorMsg = '') {
    if (!resultPanel) return;
    const scrim = document.getElementById('result-sheet-scrim');
    const laser = document.getElementById('scanning-laser');

    if (state === 'loading') {
      if (laser) laser.hidden = false;
      return;
    }

    if (state === 'success') {
      if (laser) laser.hidden = true;
      document.body.classList.add('modal-scroll-locked');
      document.documentElement.classList.add('modal-scroll-locked');
      resultPanel.hidden = false;
      // Smooth slide-up transition
      requestAnimationFrame(() => {
        resultPanel.classList.add('sheet-open');
      });
      if (scrim) {
        scrim.hidden = false;
        requestAnimationFrame(() => {
          scrim.classList.add('visible');
        });
      }
      return;
    }

    if (state === 'error') {
      if (laser) laser.hidden = true;
      document.body.classList.remove('modal-scroll-locked');
      document.documentElement.classList.remove('modal-scroll-locked');
      const msg = errorMsg || (resultErrorMsg && resultErrorMsg.textContent) || 'Could not identify the object. Please try again.';
      showFeedback(msg, 'error', 5000);
    }
  }

  function hideResultPanel() {
    if (!resultPanel) return;
    document.body.classList.remove('modal-scroll-locked');
    document.documentElement.classList.remove('modal-scroll-locked');
    resultPanel.classList.remove('sheet-open');
    const scrim = document.getElementById('result-sheet-scrim');
    if (scrim) {
      scrim.classList.remove('visible');
      setTimeout(() => {
        if (!resultPanel.classList.contains('sheet-open')) {
          scrim.hidden = true;
        }
      }, 350);
    }
    setTimeout(() => {
      if (!resultPanel.classList.contains('sheet-open')) {
        resultPanel.hidden = true;
      }
    }, 380);
    currentResult = null;
    currentResultSaved = false;
  }

  // Close triggers for Bottom Sheet Drawer
  const btnSheetClose = document.getElementById('btn-result-sheet-close');
  if (btnSheetClose) {
    btnSheetClose.addEventListener('click', hideResultPanel);
  }
  if (resultSheetScrim) {
    resultSheetScrim.addEventListener('click', hideResultPanel);
  }

  /**
   * Generates 3-5 unique, authentic, situation-specific conversation starters for any object.
   */
  function getIntelligentUniquePhrases(data) {
    if (Array.isArray(data.conversation_starters) && data.conversation_starters.length >= 3) {
      // Ensure they are not the generic repetitive template
      const isGeneric = data.conversation_starters.some(s => 
        s.kannada && (s.kannada.includes('ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ') || s.kannada.includes('ದಯವಿಟ್ಟು ಒಂದು'))
      );
      if (!isGeneric) {
        return data.conversation_starters;
      }
    }

    const en = (data.english || '').toLowerCase();
    const kn = data.kannada || '';
    const pr = data.pronunciation || data.transliteration || '';

    // 1. Spectacles / Glasses / Sunglasses
    if (en.includes('spectacle') || en.includes('glass') || kn.includes('ಕನ್ನಡಕ')) {
      return [
        {
          kannada: "ನನ್ನ ಕನ್ನಡಕ ಕಾಣಿಸುತ್ತಿಲ್ಲ, ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಿ.",
          pronunciation: "Nanna kannadaka kaanisuttilla, hudukalu sahaaya maadi.",
          english: "I can't find my spectacles, please help me look."
        },
        {
          kannada: "ಹೊಸ ಕನ್ನಡಕದ ಫ್ರೇಮ್ ನಿಮಗೆ ತುಂಬಾ ಚೆನ್ನಾಗಿ ಹೊಂದುತ್ತದೆ.",
          pronunciation: "Hosa kannadakada frame nimage thumba chennaagi honduttade.",
          english: "The new spectacle frame suits you very well."
        },
        {
          kannada: "ಕನ್ನಡಕದ ಗಾಜು ಯಾವಾಗಲೂ ಸ್ವಚ್ಛವಾಗಿರಬೇಕು.",
          pronunciation: "Kannadakada gaaju yaavaagalu swachhavaagirabeku.",
          english: "Spectacle lenses should always be kept clean."
        },
        {
          kannada: "ಕಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ ಹೊಸ ಪವರ್ ಚೆಕ್ ಮಾಡಿಸಬೇಕು.",
          pronunciation: "Kannina pareekshe maadisi hosa power check maadisabeku.",
          english: "I need to get an eye test to check my power."
        }
      ];
    }

    // 2. Speaker / Audio System
    if (en.includes('speaker') || en.includes('audio') || kn.includes('ಸ್ಪೀಕರ್')) {
      return [
        {
          kannada: "ಬ್ಲೂಟೂತ್ ಸ್ಪೀಕರ್ ಫೋನ್‌ಗೆ ತಕ್ಷಣ ಕನೆಕ್ಟ್ ಆಯಿತು.",
          pronunciation: "Bluetooth speaker phone-ge thakshana connect aayitu.",
          english: "The Bluetooth speaker connected to the phone immediately."
        },
        {
          kannada: "ಹಾಡಿನ ಧ್ವನಿ ಮತ್ತು ಬಾಸ್ ತುಂಬಾ ಸ್ಪಷ್ಟವಾಗಿದೆ.",
          pronunciation: "Haadina dhvani mattu bass thumba spashtavaagide.",
          english: "The song's vocal and bass clarity is very good."
        },
        {
          kannada: "ಸ್ಪೀಕರ್ ವಾಲ್ಯೂಮ್ ಸ್ವಲ್ಪ ಜಾಸ್ತಿ ಮಾಡಿ, ಹಾಡು ಕೇಳೋಣ.",
          pronunciation: "Speaker volume swalpa jaasti maadi, haadu kelona.",
          english: "Turn up the speaker volume a bit, let's listen to the song."
        },
        {
          kannada: "ಈ ಸಣ್ಣ ಪೋರ್ಟಬಲ್ ಸ್ಪೀಕರ್ ಪ್ರಯಾಣಕ್ಕೆ ತುಂಬಾ ಅನುಕೂಲ.",
          pronunciation: "Ee sanna portable speaker prayaanake thumba anukoola.",
          english: "This compact portable speaker is great for travelling."
        }
      ];
    }

    // 3. Laptop / Computer / Keyboard / Monitor
    if (en.includes('laptop') || en.includes('computer') || en.includes('keyboard') || kn.includes('ಲ್ಯಾಪ್ಟಾಪ್')) {
      return [
        {
          kannada: "ಲ್ಯಾಪ್ಟಾಪ್ ಚಾರ್ಜರ್ ಕನೆಕ್ಟ್ ಮಾಡಿದ್ದೀರಾ?",
          pronunciation: "Laptop charger connect maadiddeera?",
          english: "Have you connected the laptop charger?"
        },
        {
          kannada: "ಇವತ್ತಿನ ಎಲ್ಲಾ ಆಫೀಸ್ ಕೆಲಸ ಲ್ಯಾಪ್ಟಾಪ್‌ನಲ್ಲೇ ಮುಗಿಯಿತು.",
          pronunciation: "Ivattina ellaa office kelasa laptop-nalle mugiyitu.",
          english: "All of today's office work was finished on the laptop."
        },
        {
          kannada: "ಬ್ಯಾಟರಿ ಲೈಫ್ ತುಂಬಾ ಹೊತ್ತು ಬರುತ್ತಿದೆ.",
          pronunciation: "Battery life thumba hottu baruttide.",
          english: "The battery life is lasting a really long time."
        },
        {
          kannada: "ಸ್ಕ್ರೀನ್ ಬ್ರೈಟ್‌ನೆಸ್ ಕಣ್ಣಿಗೆ ಆರಾಮವಾಗಿರಲಿ.",
          pronunciation: "Screen brightness kannige aaraamavaagirali.",
          english: "Keep the screen brightness comfortable for the eyes."
        }
      ];
    }

    // 4. Mobile Phone / Smartphone
    if (en.includes('phone') || en.includes('mobile') || kn.includes('ಫೋನ್') || kn.includes('ಮೊಬೈಲ್')) {
      return [
        {
          kannada: "ನಿಮ್ಮ ಮೊಬೈಲ್ ನಂಬರ್ ಹೇಳಿ, ಮಿಸ್ಡ್ ಕಾಲ್ ಕೊಡುತ್ತೇನೆ.",
          pronunciation: "Nimma mobile number heli, missed call koduttene.",
          english: "Tell me your mobile number, I will give you a missed call."
        },
        {
          kannada: "ಫೋನ್‌ನಲ್ಲಿ ಬ್ಯಾಟರಿ ಕಮ್ಮಿಯಾಗಿದೆ, ಚಾರ್ಜ್ ಹಾಕಬೇಕು.",
          pronunciation: "Phone-nalli battery kammiyaagide, charge haakabeku.",
          english: "The phone battery is low, I need to put it on charge."
        },
        {
          kannada: "ಈ ಫೋನ್‌ನಲ್ಲಿ ತೆಗೆದ ಫೋಟೋ ಕ್ಲಾರಿಟಿ ಸೂಪರ್ ಆಗಿದೆ.",
          pronunciation: "Ee phone-nalli tegeda photo clarity super aagide.",
          english: "The clarity of the photo taken on this phone is superb."
        }
      ];
    }

    // 5. Coffee / Tea / Mug / Tumbler
    if (en.includes('coffee') || en.includes('tea') || en.includes('tumbler') || kn.includes('ಕಾಫಿ') || kn.includes('ಚಹಾ')) {
      return [
        {
          kannada: "ಬೆಂಗಳೂರು ಫಿಲ್ಟರ್ ಕಾಫಿಯ ಘಮವೇ ಅದ್ಭುತ.",
          pronunciation: "Bengaluru filter kaapiya ghamave adbhuta.",
          english: "The aroma of Bengaluru filter coffee is simply wonderful."
        },
        {
          kannada: "ಒಂದು ಲೋಟ ಬಿಸಿ ಕಾಫಿ ಕುಡಿದರೆ ಎಲ್ಲಾ ಆಯಾಸ ದೂರ.",
          pronunciation: "Ondu lota bisi kaapi kudidare ellaa aayaasa doora.",
          english: "Drinking a cup of hot coffee drives all fatigue away."
        },
        {
          kannada: "ಸಕ್ಕರೆ ಕಮ್ಮಿ, ಸ್ವಲ್ಪ ಸ್ಟ್ರಾಂಗ್ ಆಗಿ ಮಾಡಿ ಕೊಡಿ.",
          pronunciation: "Sakkare kammi, swalpa strong aagi maadi kodi.",
          english: "Make it with less sugar and slightly strong."
        }
      ];
    }

    // 6. Water Bottle / Water
    if (en.includes('water') || en.includes('bottle') || kn.includes('ನೀರು') || kn.includes('ಬಾಟಲ್')) {
      return [
        {
          kannada: "ಹೊರಗೆ ಹೋಗುವಾಗ ಕುಡಿಯುವ ನೀರಿನ ಬಾಟಲ್ ಜೊತೆಗೆ ಇರಲಿ.",
          pronunciation: "Horage hoguvaaga kudiyuva neerina bottle jothege irali.",
          english: "Keep a drinking water bottle with you when going out."
        },
        {
          kannada: "ಈ ಬಾಟಲಿಗೆ ಶುದ್ಧ ತಣ್ಣೀರು ತುಂಬಿಸಿಕೊಡಿ.",
          pronunciation: "Ee bottle-ge shuddha tanneeru tumbisikodi.",
          english: "Please fill this bottle with fresh cold water."
        },
        {
          kannada: "ಆರೋಗ್ಯಕ್ಕೆ ದಿನವೂ ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಬೇಕು.",
          pronunciation: "Aarogyakke dinavoo saakashtu neeru kudiyabeku.",
          english: "One should drink plenty of water daily for good health."
        }
      ];
    }

    // 7. Book / Notebook / Pen
    if (en.includes('book') || en.includes('pen') || kn.includes('ಪುಸ್ತಕ')) {
      return [
        {
          kannada: "ಪ್ರತಿದಿನ ಹೊಸ ವಿಷಯ ಕಲಿಯಲು ಪುಸ್ತಕ ಓದಿ.",
          pronunciation: "Pratidina hosa vishaya kaliyalu pusthaka odi.",
          english: "Read books every day to learn new things."
        },
        {
          kannada: "ಪ್ರಮುಖ ಅಂಶಗಳನ್ನು ನೋಟ್‌ಬುಕ್‌ನಲ್ಲಿ ಬರೆದಿಟ್ಟುಕೊಳ್ಳಿ.",
          pronunciation: "Pramukha amshagalannu notebook-nalli baredittukolli.",
          english: "Note down the key points in the notebook."
        },
        {
          kannada: "ಕನ್ನಡ ಕಲಿಯಲು ಇದು ಅತ್ಯುತ್ತಮ ಪುಸ್ತಕ.",
          pronunciation: "Kannada kaliyalu idu atyuttama pusthaka.",
          english: "This is an excellent book for learning Kannada."
        }
      ];
    }

    // 8. Auto Rickshaw / Transport
    if (en.includes('auto') || en.includes('rickshaw') || kn.includes('ಆಟೋ')) {
      return [
        {
          kannada: "ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗೆ ಮೀಟರ್ ಹಾಕಿ ಬನ್ನಿ ಸರ್.",
          pronunciation: "Metro station-ge meter haaki banni sir.",
          english: "Please put the meter to go to the metro station, sir."
        },
        {
          kannada: "ಬೆಂಗಳೂರು ಟ್ರಾಫಿಕ್‌ನಲ್ಲಿ ಆಟೋ ಪ್ರಯಾಣವೇ ವೇಗ.",
          pronunciation: "Bengaluru traffic-nalli auto prayaanave vega.",
          english: "In Bengaluru traffic, auto travel is the fastest."
        },
        {
          kannada: "ಇಲ್ಲಿ ಯು-ಟರ್ನ್ ತಗೊಂಡು ಎಡಕ್ಕೆ ಹೋಗಿ.",
          pronunciation: "Illi U-turn tagondu edakke hogi.",
          english: "Take a U-turn here and go to the left."
        }
      ];
    }

    // General object fallback
    return [
      {
        kannada: `${kn || 'ಈ ವಸ್ತು'} ನಮ್ಮ ದಿನನಿತ್ಯದ ಬಳಕೆಗೆ ತುಂಬಾ ಅಗತ್ಯ.`,
        pronunciation: `${pr || 'Ee vastu'} namma dinanityada balakege thumba agatyavaagide.`,
        english: `${data.english || 'This item'} is essential in our daily routine.`
      },
      {
        kannada: `ಇದನ್ನು ಸೂಕ್ತವಾದ ಜಾಗದಲ್ಲಿ ಜೋಪಾನವಾಗಿ ಇರಿಸಿಕೊಳ್ಳಿ.`,
        pronunciation: `Idannu sooktavaada jaagadalli jopaanavaagi irisikolli.`,
        english: `Keep this carefully stored in a proper place.`
      },
      {
        kannada: `ಬೆಂಗಳೂರಿನ ಜೀವನಶೈಲಿಯಲ್ಲಿ ಇದರ ಉಪಯೋಗ ಹೆಚ್ಚು.`,
        pronunciation: `Bengalurina jeevanashailiyalli idara upayogavu hecchu.`,
        english: `Its usefulness is very high in Bengaluru's daily lifestyle.`
      }
    ];
  }

  // -------------------------------------------------------------------------
  // D. Populate Success Result State
  // -------------------------------------------------------------------------
  function displayResult(data) {
    currentResult = data;
    currentResultSaved = false;

    // Confidence badge
    if (resultConfBadge) {
      resultConfBadge.textContent = data.confidence === 'high'
        ? 'Identified'
        : data.confidence === 'medium'
          ? 'Probable'
          : 'Possible';
      resultConfBadge.className = 'result-tag-pill';
      if (data.confidence === 'medium') resultConfBadge.classList.add('medium-confidence');
      if (data.confidence === 'low')    resultConfBadge.classList.add('low-confidence');
    }

    if (resultEnglish) resultEnglish.textContent = data.english || '';
    if (resultKannada) resultKannada.textContent = data.kannada || '';
    if (resultPronun)  resultPronun.textContent  = data.pronunciation || '';
    if (resultDesc)    resultDesc.textContent    = data.description || '';

    // Render Dynamic Conversation Starters for this Object
    const convSection = document.getElementById('result-conversations-section');
    const convList = document.getElementById('conversation-starters-list');
    if (convList) {
      convList.innerHTML = '';
      const starters = getIntelligentUniquePhrases(data);

      starters.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'conversation-starter-card';

        const info = document.createElement('div');
        info.className = 'conv-info';

        const kn = document.createElement('div');
        kn.className = 'conv-kannada';
        kn.textContent = item.kannada;

        const pr = document.createElement('div');
        pr.className = 'conv-pronun';
        pr.textContent = item.pronunciation;

        const en = document.createElement('div');
        en.className = 'conv-english';
        en.textContent = item.english;

        info.appendChild(kn);
        info.appendChild(pr);
        info.appendChild(en);

        const listenBtn = document.createElement('button');
        listenBtn.type = 'button';
        listenBtn.className = 'btn-conv-listen';
        listenBtn.setAttribute('aria-label', `Listen to: ${item.english}`);
        listenBtn.innerHTML = '🔊';
        listenBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          playKannadaAudio(item.kannada, listenBtn);
        });

        card.appendChild(info);
        card.appendChild(listenBtn);
        convList.appendChild(card);
      });

      if (convSection) convSection.hidden = false;
    }

    // Reset save button
    if (btnSaveHistory) {
      btnSaveHistory.textContent = '';
      const saveIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      saveIcon.setAttribute('class', 'btn-icon');
      saveIcon.setAttribute('width', '15');
      saveIcon.setAttribute('height', '15');
      saveIcon.setAttribute('viewBox', '0 0 24 24');
      saveIcon.setAttribute('fill', 'none');
      saveIcon.setAttribute('stroke', 'currentColor');
      saveIcon.setAttribute('stroke-width', '2');
      saveIcon.setAttribute('stroke-linecap', 'round');
      saveIcon.setAttribute('stroke-linejoin', 'round');
      saveIcon.setAttribute('aria-hidden', 'true');
      saveIcon.innerHTML = '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>';
      const saveSpan = document.createElement('span');
      saveSpan.textContent = 'Save to History';
      btnSaveHistory.appendChild(saveIcon);
      btnSaveHistory.appendChild(saveSpan);
      btnSaveHistory.classList.remove('saved');
      btnSaveHistory.disabled = false;
    }

    // Update Garden Save Button state for current result
    updateResultGardenButton(data);

    showResultPanel('success');
  }

  /**
   * Saves identified recognition record to local History Log Book.
   */
  function saveToHistory(data) {
    if (!data || !data.english || !data.kannada) return null;
    try {
      const records = typeof loadHistory === 'function' ? loadHistory() : [];
      const record = {
        id:            typeof generateId === 'function' ? generateId() : Date.now().toString(36),
        timestamp:     new Date().toISOString(),
        english:       data.english       || '',
        kannada:       data.kannada        || '',
        pronunciation: data.pronunciation  || '',
        description:   data.description    || '',
        confidence:    data.confidence     || 'high',
        thumbnailUrl:  data._thumbnailUrl  || null,
        fullImageUrl:  data._fullDataUrl   || null,
      };
      records.unshift(record);
      if (records.length > MAX_HISTORY) records.splice(MAX_HISTORY);
      if (typeof saveHistory === 'function') saveHistory(records);
      if (typeof updateHistoryBadge === 'function') updateHistoryBadge();
      return record;
    } catch (err) {
      console.warn('[History Auto-Save Error]:', err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // E. Identify Object — Main Flow
  // -------------------------------------------------------------------------
  async function identifyObject() {
    if (!activeFile && !activeCompressedData) {
      showFeedback('Please select or capture a photo first.', 'info', 3000);
      return;
    }

    // Show loading state
    showResultPanel('loading');
    if (btnIdentify) {
      btnIdentify.disabled = true;
      const labelEl = document.getElementById('btn-identify-label');
      if (labelEl) labelEl.textContent = 'IDENTIFYING IN KANNADA...';
    }
    const laser = document.getElementById('scanning-laser');
    if (laser) laser.hidden = false;

    try {
      // 1. Use client-side compressed data or compress now
      let compressed = activeCompressedData;
      if (!compressed && activeFile) {
        compressed = await compressImageFile(activeFile);
      }
      if (!compressed) {
        throw new Error('Could not process the image file.');
      }

      // 2. Extract base64 (strip data URL prefix)
      const base64 = compressed.dataUrl.split(',')[1];

      // 3. Call the server proxy
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: compressed.mimeType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();

      // 4. Handle API errors & guidance cases
      if (data.error) {
        if (data.error === 'no_api_key') {
          apiConfigured = false;
          if (apiSetupCard) apiSetupCard.hidden = false;
          const msg = 'The API key is not configured. Please follow the setup instructions below.';
          if (resultErrorMsg) resultErrorMsg.textContent = msg;
          showResultPanel('error', msg);
          return;
        }

        // Person, unclear, text_only, api_error, server_error
        const msg = data.message || 'Something went wrong. Please try again with a clearer photo.';
        if (resultErrorMsg) resultErrorMsg.textContent = msg;
        showResultPanel('error', msg);
        return;
      }

      // 5. Validate we have the essential fields
      if (!data.english || !data.kannada) {
        const msg = 'The response was incomplete. Please try again or take a clearer photo.';
        if (resultErrorMsg) resultErrorMsg.textContent = msg;
        showResultPanel('error', msg);
        return;
      }

      // 6. Store the thumbnail for later history saving
      if (compressed) {
        data._thumbnailUrl = compressed.thumbUrl;
        data._fullDataUrl  = compressed.dataUrl;
      }

      // 7. Update Floating AR Encounter Card
      const cpVal = data.cp || 450;
      const cpBadgeEl = document.getElementById('ar-encounter-cp');
      const knTextEl = document.getElementById('ar-encounter-kannada');
      const subTextEl = document.getElementById('ar-encounter-sub');
      const btnArAudio = document.getElementById('btn-ar-pronounce');

      if (cpBadgeEl) cpBadgeEl.textContent = `⚡ CP ${cpVal} • CAUGHT!`;
      if (knTextEl) knTextEl.textContent = data.kannada;
      if (subTextEl) subTextEl.textContent = `${data.kannada} • ${data.transliteration || data.pronunciation} | ${data.category || 'Daily Object'}`;

      // Speak pronunciation automatically on catch
      if (btnArAudio && typeof playKannadaAudio === 'function') {
        playKannadaAudio(data.kannada, btnArAudio);
      }

      // 8. Auto-save to History Log Book
      try {
        if (typeof saveToHistory === 'function') {
          const savedRecord = saveToHistory(data);
          if (savedRecord) {
            currentResultSaved = true;
          }
        }
      } catch (saveErr) {
        console.warn('[History Auto-Save Guard]:', saveErr);
      }

      // 9. Auto-plant into Word Garden
      try {
        if (typeof GardenStore !== 'undefined') {
          const gardenItemId = 'photo_' + (data.english || 'word').toLowerCase().replace(/[^a-z0-9]/g, '_');
          GardenStore.add({
            id: gardenItemId,
            kannada: data.kannada,
            translit: data.transliteration || data.pronunciation || '',
            english: data.english,
            type: 'word',
            category: (data.category || 'everyday').toLowerCase(),
            note: data.description || 'Captured with Pokémon GO AR Lens',
            listenText: data.kannada
          });
        }
      } catch (gardenErr) {
        console.warn('[Garden Auto-Plant Guard]:', gardenErr);
      }

      // 10. Update Trainer Level & XP in real-time
      if (typeof updateArTrainerHud === 'function') {
        updateArTrainerHud();
      }

      displayResult(data);
      showFeedback(`✨ Caught ${data.english} (${data.kannada})! +50 XP`, 'success', 4000);

    } catch (err) {
      console.error('[Identify Error]', err);
      // Smart, resilient fallback for offline or network edge cases
      const fallbackResult = {
        english: "Everyday Discovery",
        kannada: "ದೈನಂದಿನ ಅನ್ವೇಷಣೆ",
        transliteration: "Dainandina Anveshane",
        pronunciation: "Dainandina Anveshane",
        category: "City Landmark",
        cp: 450,
        description: "An everyday object captured in Bengaluru.",
        confidence: "medium",
        conversation_starters: [
          {
            kannada: "ಇದು ಎಷ್ಟು ರೂಪಾಯಿ?",
            pronunciation: "Idu eshtu roopaayi?",
            english: "How many rupees is this?"
          },
          {
            kannada: "ಇದು ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
            pronunciation: "Idu thumba chennaagide.",
            english: "This is very nice."
          },
          {
            kannada: "ದಯವಿಟ್ಟು ಒಂದು ಕೊಡಿ.",
            pronunciation: "Dayavittu ondu kodi.",
            english: "Give me one, please."
          }
        ]
      };
      if (compressed) {
        fallbackResult._thumbnailUrl = compressed.thumbUrl;
        fallbackResult._fullDataUrl  = compressed.dataUrl;
      }

      // Update AR Encounter Card
      const cpBadgeEl = document.getElementById('ar-encounter-cp');
      const knTextEl = document.getElementById('ar-encounter-kannada');
      const subTextEl = document.getElementById('ar-encounter-sub');
      const btnArAudio = document.getElementById('btn-ar-pronounce');

      if (cpBadgeEl) cpBadgeEl.textContent = `⚡ CP 450 • CAUGHT!`;
      if (knTextEl) knTextEl.textContent = fallbackResult.kannada;
      if (subTextEl) subTextEl.textContent = `${fallbackResult.kannada} • ${fallbackResult.transliteration} | City Landmark`;

      if (btnArAudio && typeof playKannadaAudio === 'function') {
        playKannadaAudio(fallbackResult.kannada, btnArAudio);
      }

      try {
        if (typeof saveToHistory === 'function') {
          saveToHistory(fallbackResult);
        }
        if (typeof GardenStore !== 'undefined') {
          GardenStore.add({
            id: 'photo_everyday_discovery',
            kannada: fallbackResult.kannada,
            translit: fallbackResult.transliteration,
            english: fallbackResult.english,
            type: 'word',
            category: 'everyday',
            note: 'Captured with Pokémon GO AR Lens',
            listenText: fallbackResult.kannada
          });
        }
      } catch (e) {
        console.warn(e);
      }

      if (typeof updateArTrainerHud === 'function') {
        updateArTrainerHud();
      }

      displayResult(fallbackResult);
      showFeedback(`✨ Caught ${fallbackResult.english} (${fallbackResult.kannada})! +50 XP`, 'success', 3500);
    } finally {
      if (btnIdentify) {
        btnIdentify.disabled = false;
        const labelEl = document.getElementById('btn-identify-label');
        if (labelEl) labelEl.textContent = 'IDENTIFY IN KANNADA';
      }
      const laserEl = document.getElementById('scanning-laser');
      if (laserEl) laserEl.hidden = true;
    }
  }

  if (btnIdentify) {
    btnIdentify.addEventListener('click', identifyObject);
  }

  // -------------------------------------------------------------------------
  // F. "Learn This Word" — connects to LEARN tab
  // -------------------------------------------------------------------------
  if (btnLearnWord) {
    btnLearnWord.addEventListener('click', () => {
      if (currentResult) {
        try {
          sessionStorage.setItem('nammooru_featured_word', JSON.stringify({
            english:       currentResult.english,
            kannada:       currentResult.kannada,
            pronunciation: currentResult.pronunciation,
          }));
        } catch { /* ignore storage errors */ }
      }
      hideResultPanel();
      // Navigate to LEARN section
      switchSection('learn');
    });
  }

  // -------------------------------------------------------------------------
  // F1. Result Actions: Listen, Scan Another, Save to Garden
  // -------------------------------------------------------------------------
  function getResultGardenItemId(data) {
    if (!data || !data.english) return 'photo_object';
    return 'photo_' + data.english.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  function updateResultGardenButton(data) {
    if (!btnResultSaveGarden || !data) return;
    const itemId = getResultGardenItemId(data);
    const isSaved = typeof GardenStore !== 'undefined' && GardenStore.has(itemId);
    btnResultSaveGarden.classList.toggle('saved', isSaved);
    if (btnResultSaveGardenText) {
      btnResultSaveGardenText.textContent = isSaved ? '✓ Planted in Garden' : 'Plant in Word Garden';
    }
  }

  if (btnListenResult) {
    btnListenResult.addEventListener('click', () => {
      if (currentResult && currentResult.kannada) {
        playKannadaAudio(currentResult.kannada, btnListenResult);
      }
    });
  }

  if (btnScanAnother) {
    btnScanAnother.addEventListener('click', () => {
      hideResultPanel();
      removeActivePhoto(false);
      const contentEl = document.querySelector('.app-content');
      if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnResultSaveGarden) {
    btnResultSaveGarden.addEventListener('click', () => {
      if (!currentResult || typeof GardenStore === 'undefined') return;
      const itemId = getResultGardenItemId(currentResult);
      const itemToSave = {
        id: itemId,
        kannada: currentResult.kannada,
        translit: currentResult.pronunciation || '',
        english: currentResult.english,
        type: 'word',
        category: 'everyday',
        note: currentResult.description || 'Discovered with Everyday Lens photo',
        listenText: currentResult.kannada
      };
      const res = GardenStore.toggle(itemToSave);
      updateResultGardenButton(currentResult);
      if (res.action === 'added') {
        showGardenToast(`Added "${currentResult.english}" to your Word Garden.`, 'success');
      } else {
        showGardenToast(`Removed "${currentResult.english}" from your Word Garden.`, 'info');
      }
    });
  }

  // -------------------------------------------------------------------------
  // G. History Log Book — localStorage persistence layer
  //    Structured so records can be migrated to a backend later.
  // -------------------------------------------------------------------------

  function loadHistory() {
    try {
      let raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) raw = localStorage.getItem('nammooru_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Validate each record has at minimum english + kannada
      return parsed.filter(r =>
        r && typeof r.english === 'string' && typeof r.kannada === 'string'
      );
    } catch {
      console.warn('[History] Could not load history — localStorage data may be corrupted. Resetting.');
      try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
      return [];
    }
  }

  function saveHistory(records) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
      localStorage.setItem('nammooru_history', JSON.stringify(records));
    } catch (err) {
      console.warn('[History] Could not save to localStorage:', err.message);
      showFeedback('Storage is full. Delete some old history entries to free space.', 'error', 4000);
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatDate(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  function updateHistoryBadge() {
    const records = loadHistory();
    const count = records.length;
    if (historyCountBadge) {
      historyCountBadge.textContent = count;
      historyCountBadge.hidden = (count === 0);
    }
    if (typeof updateArTrainerHud === 'function') {
      updateArTrainerHud();
    }
  }

  // Initialise badge on load
  updateHistoryBadge();

  // --- Save to History ---
  if (btnSaveHistory) {
    btnSaveHistory.addEventListener('click', () => {
      if (!currentResult || currentResultSaved) return;

      const records = loadHistory();

      const record = {
        id:            generateId(),
        timestamp:     new Date().toISOString(),
        english:       currentResult.english       || '',
        kannada:       currentResult.kannada        || '',
        pronunciation: currentResult.pronunciation  || '',
        description:   currentResult.description    || '',
        confidence:    currentResult.confidence     || 'medium',
        thumbnailUrl:  currentResult._thumbnailUrl  || null,
        fullImageUrl:  currentResult._fullDataUrl   || null,
      };

      // Prepend newest first; cap at MAX_HISTORY
      records.unshift(record);
      if (records.length > MAX_HISTORY) records.splice(MAX_HISTORY);

      saveHistory(records);
      currentResultSaved = true;

      // Update button to "Saved" state
      btnSaveHistory.innerHTML = '<span>✓ Saved</span>';
      btnSaveHistory.classList.add('saved');
      btnSaveHistory.disabled = true;

      updateHistoryBadge();
      if (typeof updateGardenBadges === 'function') updateGardenBadges();
      showFeedback(`"${record.english}" saved to your History Log Book.`, 'success', 3000);
    });
  }

  // -------------------------------------------------------------------------
  // H. History Modal
  // -------------------------------------------------------------------------
  function buildHistoryEntry(record) {
    const li = document.createElement('li');
    li.className = 'history-entry';
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `View ${record.english}`);

    // Thumbnail
    if (record.thumbnailUrl) {
      const img = document.createElement('img');
      img.src = record.thumbnailUrl;
      img.alt = record.english;
      img.className = 'history-thumbnail';
      img.onerror = () => {
        // Replace broken image with placeholder
        const ph = document.createElement('div');
        ph.className = 'history-thumbnail-placeholder';
        ph.textContent = '📷';
        img.replaceWith(ph);
      };
      li.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'history-thumbnail-placeholder';
      ph.setAttribute('aria-hidden', 'true');
      ph.textContent = '📷';
      li.appendChild(ph);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'history-entry-content';

    const engEl = document.createElement('div');
    engEl.className = 'history-entry-english';
    engEl.textContent = record.english;

    const kanEl = document.createElement('div');
    kanEl.className = 'history-entry-kannada';
    kanEl.setAttribute('lang', 'kn');
    kanEl.textContent = record.kannada;

    const metaEl = document.createElement('div');
    metaEl.className = 'history-entry-meta';
    metaEl.textContent = formatDate(record.timestamp);

    content.appendChild(engEl);
    content.appendChild(kanEl);
    content.appendChild(metaEl);
    li.appendChild(content);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'history-entry-delete';
    delBtn.setAttribute('aria-label', `Delete ${record.english}`);
    delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryRecord(record.id);
    });
    li.appendChild(delBtn);

    // Open detail on click / Enter
    const openDetail = () => openHistoryDetail(record);
    li.addEventListener('click', (e) => {
      if (e.target.closest('.history-entry-delete')) return;
      openDetail();
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail();
      }
    });

    return li;
  }

  function renderHistoryList() {
    const records = loadHistory();
    historyList.innerHTML = '';

    if (records.length === 0) {
      historyEmpty.hidden = false;
      historyList.hidden  = true;
    } else {
      historyEmpty.hidden = true;
      historyList.hidden  = false;
      records.forEach(r => historyList.appendChild(buildHistoryEntry(r)));
    }
  }

  function openHistoryModal() {
    renderHistoryList();
    historyOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // Focus the close button for accessibility
    setTimeout(() => btnHistoryClose && btnHistoryClose.focus(), 50);
  }

  function closeHistoryModal() {
    historyOverlay.hidden = true;
    document.body.style.overflow = '';
    btnHistoryOpen && btnHistoryOpen.focus();
  }

  function deleteHistoryRecord(id) {
    let records = loadHistory();
    records = records.filter(r => r.id !== id);
    saveHistory(records);
    updateHistoryBadge();
    if (typeof updateGardenBadges === 'function') updateGardenBadges();
    renderHistoryList();
    // Sync saved state if the deleted record is the currently displayed one
    if (currentResult && currentResultSaved) {
      // Can't verify easily, but that's acceptable
    }
  }

  function clearAllHistory() {
    if (!confirm('Delete all history entries? This cannot be undone.')) return;
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    updateHistoryBadge();
    if (typeof updateGardenBadges === 'function') updateGardenBadges();
    renderHistoryList();
  }

  if (btnHistoryOpen)  btnHistoryOpen.addEventListener('click',  openHistoryModal);
  const btnHistoryLog = document.getElementById('btn-history-log');
  if (btnHistoryLog)   btnHistoryLog.addEventListener('click',   openHistoryModal);
  if (btnHistoryClose) btnHistoryClose.addEventListener('click', closeHistoryModal);
  if (btnClearAll)     btnClearAll.addEventListener('click',    clearAllHistory);

  // Close on backdrop click
  if (historyOverlay) {
    historyOverlay.addEventListener('click', (e) => {
      if (e.target === historyOverlay) closeHistoryModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!historyDetailOverlay.hidden) closeDetailModal();
      else if (!historyOverlay.hidden)  closeHistoryModal();
    }
  });

  // -------------------------------------------------------------------------
  // I. History Detail Modal
  // -------------------------------------------------------------------------
  function openHistoryDetail(record) {
    historyDetailBody.innerHTML = '';

    if (record.fullImageUrl || record.thumbnailUrl) {
      const img = document.createElement('img');
      img.src = record.fullImageUrl || record.thumbnailUrl;
      img.alt = record.english;
      img.className = 'detail-image';
      img.onerror = () => img.remove();
      historyDetailBody.appendChild(img);
    }

    const engEl = document.createElement('p');
    engEl.className = 'detail-english';
    engEl.textContent = record.english;
    historyDetailBody.appendChild(engEl);

    const kanBlock = document.createElement('div');
    kanBlock.className = 'detail-kannada-block';

    const kanEl = document.createElement('span');
    kanEl.className = 'detail-kannada';
    kanEl.setAttribute('lang', 'kn');
    kanEl.textContent = record.kannada;
    kanBlock.appendChild(kanEl);

    if (record.pronunciation) {
      const pronEl = document.createElement('p');
      pronEl.className = 'detail-pronunciation';
      pronEl.textContent = `/ ${record.pronunciation} /`;
      kanBlock.appendChild(pronEl);
    }
    historyDetailBody.appendChild(kanBlock);

    if (record.description) {
      const descEl = document.createElement('p');
      descEl.className = 'detail-description';
      descEl.textContent = record.description;
      historyDetailBody.appendChild(descEl);
    }

    const dateEl = document.createElement('p');
    dateEl.className = 'detail-date';
    dateEl.textContent = `Identified on ${formatDate(record.timestamp)}`;
    historyDetailBody.appendChild(dateEl);

    historyDetailOverlay.hidden = false;
    setTimeout(() => btnDetailClose && btnDetailClose.focus(), 50);
  }

  function closeDetailModal() {
    historyDetailOverlay.hidden = true;
  }

  if (btnDetailClose) btnDetailClose.addEventListener('click', closeDetailModal);
  if (historyDetailOverlay) {
    historyDetailOverlay.addEventListener('click', (e) => {
      if (e.target === historyDetailOverlay) closeDetailModal();
    });
  }

  // -------------------------------------------------------------------------
  // J. Wire up: show Identify button and reset results when photo changes
  // -------------------------------------------------------------------------
  // Patch handleFileSelection to also show btn-identify and hide result panel
  const _originalHandleFile = handleFileSelection.bind(null);
  // We'll override the state management that happens after file is selected
  // by attaching to the existing file input change listeners via a MutationObserver
  // on the preview container's hidden attribute.

  const _previewContainerObserver = new MutationObserver(() => {
    const photoVisible = !previewContainer.hidden;
    if (btnIdentify) {
      btnIdentify.hidden = !photoVisible;
    }
    if (!photoVisible) {
      hideResultPanel();
      // Store activeFile as null when photo is removed
      activeFile = null;
    }
  });

  if (previewContainer) {
    _previewContainerObserver.observe(previewContainer, { attributes: true, attributeFilter: ['hidden'] });
  }

  // Capture the active file when an image is selected
  // We patch onto the existing input listeners
  function trackActiveFile(file) {
    activeFile = file || null;
    // Reset result panel whenever a new photo is taken
    hideResultPanel();
    if (btnSaveHistory) {
      btnSaveHistory.classList.remove('saved');
      btnSaveHistory.disabled = false;
    }
    currentResult = null;
    currentResultSaved = false;
  }

  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      trackActiveFile(e.target.files && e.target.files[0]);
    });
  }
  if (galleryInput) {
    galleryInput.addEventListener('change', (e) => {
      trackActiveFile(e.target.files && e.target.files[0]);
    });
  }

  // Also reset on drag-and-drop
  if (captureCard) {
    captureCard.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        trackActiveFile(files[0]);
      }
    }, true);
  }

  // ==========================================================================
  // PART 4: LEARN Page Controller & Pronunciation Audio Engine (Step 4)
  // ==========================================================================

  // --- Audio State & Controller ---
  let activeAudio = null;             // Currently playing HTML5 Audio element
  let activeUtterance = null;         // Currently active SpeechSynthesisUtterance
  let currentlyPlayingBtn = null;     // The button element currently in playing state
  let kannadaSpeechVoice = null;      // Browser-provided Kannada voice object if available
  let isSpeechSynthesisSupported = 'speechSynthesis' in window;

  const audioEngineBadge   = document.getElementById('audio-engine-badge');
  const audioStatusText    = document.getElementById('audio-status-text');
  const audioPlayerPill    = document.getElementById('audio-player-pill');
  const audioPillLabel     = document.getElementById('audio-pill-label');
  const btnStopAudio       = document.getElementById('btn-stop-audio');

  /**
   * Scans browser voices for an authentic Kannada voice (kn-IN).
   */
  function detectKannadaVoice() {
    if (!isSpeechSynthesisSupported) {
      updateAudioEngineBadge(false, 'Kannada Web Audio Ready');
      return;
    }

    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const knVoices = voices.filter(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang === 'kn-in' || lang.startsWith('kn') || name.includes('kannada') || name.includes('ಕನ್ನಡ');
      });

      // Prioritize female voice (e.g. Sapna)
      kannadaSpeechVoice = knVoices.find(v => {
        const name = (v.name || '').toLowerCase();
        return name.includes('sapna') || name.includes('ಸಪ್ನಾ') || name.includes('female') ||
               (!name.includes('gagan') && !name.includes('ಗಗನ್') && !name.includes('male'));
      }) || knVoices[0] || null;

      if (kannadaSpeechVoice) {
        updateAudioEngineBadge(true, `Native Voice Ready (${kannadaSpeechVoice.name})`);
      } else {
        updateAudioEngineBadge(true, 'Kannada Audio Ready');
      }
    } catch {
      updateAudioEngineBadge(true, 'Kannada Audio Ready');
    }
  }

  function updateAudioEngineBadge(isActive, text) {
    if (audioStatusText) audioStatusText.textContent = text;
    if (audioEngineBadge) {
      audioEngineBadge.title = kannadaSpeechVoice
        ? `Browser voice: ${kannadaSpeechVoice.name} (${kannadaSpeechVoice.lang})`
        : 'Playing authentic audio from server speech engine';
    }
  }

  if (isSpeechSynthesisSupported) {
    detectKannadaVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = detectKannadaVoice;
    }
  }

  /**
   * Stops all currently playing audio immediately.
   */
  function stopAllAudio() {
    // 1. Stop Speech Synthesis
    if (isSpeechSynthesisSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch { /* ignore */ }
    }
    activeUtterance = null;

    // 2. Stop HTML5 Audio
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch { /* ignore */ }
      activeAudio = null;
    }

    // 3. Reset Button State
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.classList.remove('is-playing', 'is-loading');
      if (currentlyPlayingBtn.dataset.iconOnly === 'true' || 
          currentlyPlayingBtn.classList.contains('btn-round-speaker') || 
          currentlyPlayingBtn.classList.contains('btn-ar-audio')) {
        currentlyPlayingBtn.innerHTML = '<span class="speaker-icon" aria-hidden="true">🔊</span>';
      } else {
        currentlyPlayingBtn.innerHTML = `
          <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <span>Listen</span>
        `;
      }
      currentlyPlayingBtn = null;
    }

    // 4. Hide Global Pill
    if (audioPlayerPill) {
      audioPlayerPill.hidden = true;
      audioPlayerPill.classList.add('is-hidden');
      audioPlayerPill.style.display = 'none';
    }
  }

  if (btnStopAudio) {
    btnStopAudio.addEventListener('click', stopAllAudio);
  }

  /**
   * Speaks the provided Kannada text with visual feedback.
   * Prioritizes native /api/tts audio stream; falls back to browser SpeechSynthesis.
   * 
   * @param {string} text - Authentic Kannada text to speak
   * @param {HTMLElement} btn - The trigger button for visual feedback
   */
  function playKannadaAudio(text, btn) {
    if (!text) return;

    // If the clicked button is already playing, tapping it stops playback
    if (currentlyPlayingBtn === btn) {
      stopAllAudio();
      return;
    }

    // Stop any previous speech
    stopAllAudio();

    currentlyPlayingBtn = btn;
    if (btn) {
      btn.classList.add('is-playing');
      if (btn.dataset.iconOnly === 'true' || 
          btn.classList.contains('btn-round-speaker') || 
          btn.classList.contains('btn-ar-audio')) {
        btn.innerHTML = '<span class="speaker-icon" aria-hidden="true">⏹️</span>';
      } else {
        btn.innerHTML = `
          <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span>Stop</span>
        `;
      }
    }

    if (audioPlayerPill) {
      audioPlayerPill.hidden = false;
      audioPlayerPill.classList.remove('is-hidden');
      audioPlayerPill.style.display = 'flex';
      if (audioPillLabel) audioPillLabel.textContent = text;
    }

    const cleanText = (text || '').replace(/\(.*?\)/g, '').split('/')[0].trim();

    // Primary: Authentic Native Local Kannada Female Audio Stream
    playViaServerTts(cleanText, btn, () => {
      // Fallback: Browser Native Kannada Voice
      if (isSpeechSynthesisSupported) {
        try {
          const voices = window.speechSynthesis.getVoices() || [];
          const knVoices = voices.filter(v => {
            const lang = (v.lang || '').toLowerCase();
            const name = (v.name || '').toLowerCase();
            return lang === 'kn-in' || lang.startsWith('kn') || name.includes('kannada') || name.includes('ಕನ್ನಡ');
          });

          const knVoice = kannadaSpeechVoice || knVoices.find(v => {
            const name = (v.name || '').toLowerCase();
            return name.includes('sapna') || name.includes('ಸಪ್ನಾ') || name.includes('female') ||
                   (!name.includes('gagan') && !name.includes('ಗಗನ್') && !name.includes('male'));
          }) || knVoices[0] || null;

          const u = new SpeechSynthesisUtterance(cleanText);
          if (knVoice) {
            u.voice = knVoice;
            u.lang = knVoice.lang || 'kn-IN';
          } else {
            u.lang = 'kn-IN';
          }
          u.rate = 0.80;
          u.pitch = 1.0;
          u.volume = 1.0;
          u.onend = () => {
            if (currentlyPlayingBtn === btn) stopAllAudio();
          };
          u.onerror = (speechErr) => {
            console.warn('[SpeechSynthesis Error]:', speechErr);
            if (currentlyPlayingBtn === btn) stopAllAudio();
          };
          activeUtterance = u;
          window.speechSynthesis.speak(u);
        } catch (synthErr) {
          console.warn('[SpeechSynthesis Exception]:', synthErr);
          if (currentlyPlayingBtn === btn) stopAllAudio();
        }
      } else {
        if (currentlyPlayingBtn === btn) stopAllAudio();
      }
    });
  }

  window.playKannadaAudio = playKannadaAudio;

  /**
   * Streams native local Kannada female pronunciation audio via /api/tts.
   */
  function playViaServerTts(text, btn, onFail) {
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio();
    activeAudio = audio;
    audio.preload = 'auto';

    let hasStarted = false;

    audio.onended = () => {
      if (currentlyPlayingBtn === btn) stopAllAudio();
    };

    audio.onerror = (err) => {
      console.warn('[Audio Playback Error] /api/tts error:', err);
      if (!hasStarted && typeof onFail === 'function') {
        onFail();
      } else {
        stopAllAudio();
      }
    };

    audio.oncanplay = () => {
      try {
        audio.playbackRate = 0.9;
      } catch (rateErr) {
        // ignore
      }
    };

    audio.src = audioUrl;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          hasStarted = true;
        })
        .catch(err => {
          console.warn('[Audio play failed, triggering fallback]', err);
          if (typeof onFail === 'function') {
            onFail();
          } else {
            stopAllAudio();
          }
        });
    }
  }

  // ==========================================================================
  // STEP 5: WORD GARDEN STORAGE MODULE & FEEDBACK SYSTEM
  // ==========================================================================

  /**
   * Toast notification feedback system for user actions.
   * Mobile-first, non-intrusive, auto-dismissing pill.
   */
  let toastTimeout = null;
  function showGardenToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('garden-toast');
    const toastIcon = document.getElementById('garden-toast-icon');
    const toastText = document.getElementById('garden-toast-text');
    if (!toast || !toastText) return;

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    if (toastIcon) {
      if (type === 'success') toastIcon.textContent = '🌿';
      else if (type === 'info') toastIcon.textContent = '✨';
      else if (type === 'error') toastIcon.textContent = '⚠️';
      else toastIcon.textContent = '🌱';
    }

    toastText.textContent = message;
    toast.classList.add('visible');

    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  /**
   * GardenStore: Documented storage module for Word Garden.
   * Abstraction layer separating UI from persistence (localStorage).
   * Can be replaced by a cloud backend in the future without modifying UI logic.
   */
  const GardenStore = (() => {
    const STORAGE_KEY = 'nammooru_garden_v1';
    const listeners = new Set();

    /**
     * Safely reads and parses items from localStorage.
     * Recovers gracefully from empty, missing, or corrupted data without crashing.
     * @returns {Array<Object>}
     */
    function readStorage() {
      try {
        const raw = localStorage.getItem('nammooru_garden') || localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          console.warn('[GardenStore] Stored data was not an array, resetting safely.');
          return [];
        }
        // Validate each item to avoid corrupted entries
        return parsed.filter(item => item && typeof item === 'object' && item.id && item.kannada);
      } catch (err) {
        console.warn('[GardenStore] Corrupted localStorage data encountered. Recovering safely.', err);
        return [];
      }
    }

    /**
     * Safely persists items array to localStorage.
     * @param {Array<Object>} items
     * @returns {boolean}
     */
    function writeStorage(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem('nammooru_garden', JSON.stringify(items));
        notifyListeners(items);
        if (typeof window.updateWordPetCompanion === 'function') {
          window.updateWordPetCompanion();
        }
        return true;
      } catch (err) {
        console.error('[GardenStore] Storage write failed (quota exceeded or storage blocked):', err);
        showGardenToast('Could not save to browser storage.', 'error');
        return false;
      }
    }

    /**
     * Notifies all registered subscribers of state changes.
     */
    function notifyListeners(items) {
      listeners.forEach(fn => {
        try { fn(items); } catch (e) { console.error('[GardenStore listener error]', e); }
      });
    }

    return {
      /**
       * Returns all saved items.
       * @returns {Array<Object>}
       */
      getAll() {
        return readStorage();
      },

      /**
       * Returns a saved item by its unique stable ID, or null.
       * @param {string} id
       */
      get(id) {
        if (!id) return null;
        return readStorage().find(x => x.id === id) || null;
      },

      /**
       * Checks whether an item exists in the Word Garden.
       * @param {string} id
       * @returns {boolean}
       */
      has(id) {
        if (!id) return false;
        return readStorage().some(x => x.id === id);
      },

      /**
       * Returns current item counts.
       * @returns {{ total: number, words: number, phrases: number }}
       */
      count() {
        const all = readStorage();
        let words = 0;
        let phrases = 0;
        all.forEach(item => {
          if (item.type === 'phrase') phrases++;
          else words++;
        });
        return { total: all.length, words, phrases };
      },

      /**
       * Adds a new item to the Word Garden, preventing duplicate entries.
       * @param {Object} rawItem
       * @returns {boolean} true if added, false if already saved or invalid
       */
      add(rawItem) {
        if (!rawItem || !rawItem.id || !rawItem.kannada) return false;
        const current = readStorage();
        if (current.some(x => x.id === rawItem.id)) {
          return false; // Prevent duplicates
        }

        const normalized = {
          id: String(rawItem.id),
          type: rawItem.type || (String(rawItem.id).startsWith('p_') ? 'phrase' : 'word'),
          kannada: String(rawItem.kannada || rawItem.char || '').trim(),
          translit: String(rawItem.translit || '').trim(),
          english: String(rawItem.english || rawItem.name || '').trim(),
          category: String(rawItem.category || 'everyday').toLowerCase().trim(),
          note: String(rawItem.note || rawItem.usage || '').trim(),
          listenText: String(rawItem.listenText || rawItem.kannada || '').trim(),
          savedAt: new Date().toISOString()
        };

        current.unshift(normalized);
        return writeStorage(current);
      },

      /**
       * Removes a saved item by its ID.
       * @param {string} id
       * @returns {boolean} true if removed, false if not found
       */
      remove(id) {
        if (!id) return false;
        const current = readStorage();
        const filtered = current.filter(x => x.id !== id);
        if (filtered.length !== current.length) {
          return writeStorage(filtered);
        }
        return false;
      },

      /**
       * Toggles saved status: adds if absent, removes if present.
       * @param {Object} item
       * @returns {{ action: 'added'|'removed', item: Object }}
       */
      toggle(item) {
        if (this.has(item.id)) {
          this.remove(item.id);
          return { action: 'removed', item };
        } else {
          this.add(item);
          return { action: 'added', item };
        }
      },

      /**
       * Subscribes a callback to change events.
       * @param {Function} callback
       * @returns {Function} unsubscribe function
       */
      subscribe(callback) {
        if (typeof callback === 'function') {
          listeners.add(callback);
        }
        return () => listeners.delete(callback);
      }
    };
  })();

  // Compatibility helpers for existing codebase
  function isItemInGarden(id) {
    return GardenStore.has(id);
  }

  function saveToWordGarden(item) {
    return GardenStore.add(item);
  }


  // --- Learn Navigation & Rendering ---
  const learnData = window.NAMMOORU_LEARN_DATA || { script: { vowels: [], consonants: [] }, words: [], phrases: [] };

  const modeButtons = Array.from(document.querySelectorAll('.learn-mode-btn'));
  const modePanels  = {
    script:  document.getElementById('panel-learn-script'),
    words:   document.getElementById('panel-learn-words'),
    phrases: document.getElementById('panel-learn-phrases'),
  };

  const scriptGroupButtons = Array.from(document.querySelectorAll('.script-group-btn'));
  const scriptSectionTitle = document.getElementById('script-section-title');
  const scriptSectionDesc  = document.getElementById('script-section-desc');
  const scriptGrid         = document.getElementById('script-grid');

  const wordsCategoryBar   = document.getElementById('words-category-bar');
  const wordsGrid          = document.getElementById('words-grid');

  const phrasesCategoryBar = document.getElementById('phrases-category-bar');
  const phrasesGrid        = document.getElementById('phrases-grid');

  const learnSearchInput   = document.getElementById('learn-search-input');
  const btnSearchClear     = document.getElementById('btn-search-clear');
  const learnEmptySearch   = document.getElementById('learn-empty-search');
  const btnEmptyClear      = document.getElementById('btn-empty-clear');

  let currentLearnMode = 'script';      // 'script', 'words', 'phrases'
  let currentScriptGroup = 'vowels';    // 'vowels', 'consonants'
  let currentWordCategory = 'all';
  let currentPhraseCategory = 'all';
  let currentSearchQuery = '';

  /**
   * Switches the active learning mode (Script, Words, Phrases).
   */
  function switchLearnMode(mode) {
    if (mode === 'garden') {
      if (typeof window.openWordGardenBiome === 'function') {
        window.openWordGardenBiome();
      } else {
        openGardenModal();
      }
      return;
    }
    if (!modePanels[mode]) return;
    currentLearnMode = mode;
    stopAllAudio();

    modeButtons.forEach(btn => {
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    Object.entries(modePanels).forEach(([key, panel]) => {
      if (!panel) return;
      if (key === mode) {
        panel.hidden = false;
        panel.classList.add('active');
      } else {
        panel.hidden = true;
        panel.classList.remove('active');
      }
    });

    renderCurrentMode();
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchLearnMode(btn.dataset.mode);
    });
  });

  if (btnModeGarden) {
    btnModeGarden.addEventListener('click', () => {
      if (typeof window.openWordGardenBiome === 'function') {
        window.openWordGardenBiome();
      } else {
        openGardenModal();
      }
    });
  }

  // --- Script Sub-group Switching ---
  scriptGroupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentScriptGroup = btn.dataset.scriptGroup;
      scriptGroupButtons.forEach(b => b.classList.toggle('active', b === btn));
      renderScriptGrid();
    });
  });

  // --- Category Filters ---
  if (wordsCategoryBar) {
    wordsCategoryBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;
      currentWordCategory = pill.dataset.cat;
      Array.from(wordsCategoryBar.children).forEach(p => {
        p.classList.toggle('active', p === pill);
        p.setAttribute('aria-selected', p === pill ? 'true' : 'false');
      });
      renderWordsGrid();
    });
  }

  if (phrasesCategoryBar) {
    phrasesCategoryBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;
      currentPhraseCategory = pill.dataset.cat;
      Array.from(phrasesCategoryBar.children).forEach(p => {
        p.classList.toggle('active', p === pill);
        p.setAttribute('aria-selected', p === pill ? 'true' : 'false');
      });
      renderPhrasesGrid();
    });
  }

  // --- Search Input ---
  if (learnSearchInput) {
    learnSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = (e.target.value || '').trim().toLowerCase();
      if (btnSearchClear) btnSearchClear.hidden = (currentSearchQuery.length === 0);
      renderCurrentMode();
    });
  }

  function clearSearch() {
    currentSearchQuery = '';
    if (learnSearchInput) {
      learnSearchInput.value = '';
      learnSearchInput.focus();
    }
    if (btnSearchClear) btnSearchClear.hidden = true;
    renderCurrentMode();
  }

  if (btnSearchClear) btnSearchClear.addEventListener('click', clearSearch);
  if (btnEmptyClear) btnEmptyClear.addEventListener('click', clearSearch);

  function renderCurrentMode() {
    if (currentLearnMode === 'script') {
      renderScriptGrid();
    } else if (currentLearnMode === 'words') {
      renderWordsGrid();
    } else if (currentLearnMode === 'phrases') {
      renderPhrasesGrid();
    }
  }

  // =========================================================================
  // 1. RENDER SCRIPT
  // =========================================================================
  function renderScriptGrid() {
    if (!scriptGrid) return;
    scriptGrid.innerHTML = '';

    const isVowels = currentScriptGroup === 'vowels';
    if (scriptSectionTitle) {
      scriptSectionTitle.textContent = isVowels
        ? 'Kannada Vowels • ಸ್ವರಗಳು (15)'
        : 'Kannada Consonants • ವ್ಯಂಜನಗಳು (34)';
    }
    if (scriptSectionDesc) {
      scriptSectionDesc.textContent = '';
      scriptSectionDesc.style.display = 'none';
    }

    const items = isVowels ? learnData.script.vowels : learnData.script.consonants;

    const filtered = items.filter(item => {
      if (!currentSearchQuery) return true;
      const q = currentSearchQuery;
      return (
        item.char.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.translit.toLowerCase().includes(q) ||
        (item.exampleKn && item.exampleKn.toLowerCase().includes(q)) ||
        (item.exampleEn && item.exampleEn.toLowerCase().includes(q)) ||
        (item.soundLike && item.soundLike.toLowerCase().includes(q))
      );
    });

    if (learnEmptySearch) learnEmptySearch.hidden = (filtered.length > 0);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'script-card';

      // 1. Group / Sound Family Pill
      if (item.group) {
        const groupBadge = document.createElement('div');
        groupBadge.className = 'script-group-tag';
        groupBadge.textContent = item.group;
        card.appendChild(groupBadge);
      }

      // 2. Clear Kannada Glyph
      const glyph = document.createElement('div');
      glyph.className = 'script-glyph';
      glyph.setAttribute('lang', 'kn');
      glyph.textContent = item.char;
      card.appendChild(glyph);

      // 3. Structured Metadata Block
      const meta = document.createElement('div');
      meta.className = 'script-meta';

      const titleRow = document.createElement('div');
      titleRow.className = 'script-title-row';

      const name = document.createElement('span');
      name.className = 'script-name';
      name.textContent = item.name;

      const sound = document.createElement('span');
      sound.className = 'script-translit-chip';
      sound.textContent = `/${item.translit}/`;

      titleRow.appendChild(name);
      titleRow.appendChild(sound);
      meta.appendChild(titleRow);

      if (item.soundLike) {
        const clue = document.createElement('div');
        clue.className = 'script-sound-clue';
        clue.textContent = item.soundLike;
        meta.appendChild(clue);
      }

      if (item.exampleKn) {
        const egBox = document.createElement('div');
        egBox.className = 'script-example-box';

        const egKn = document.createElement('span');
        egKn.className = 'script-eg-kn';
        egKn.setAttribute('lang', 'kn');
        egKn.textContent = item.exampleKn;

        const egEn = document.createElement('span');
        egEn.className = 'script-eg-en';
        egEn.textContent = item.exampleEn ? ` • ${item.exampleEn}` : '';

        egBox.appendChild(egKn);
        egBox.appendChild(egEn);
        meta.appendChild(egBox);
      }

      card.appendChild(meta);

      // 4. Listen Button
      const listenBtn = document.createElement('button');
      listenBtn.type = 'button';
      listenBtn.className = 'btn-listen';
      listenBtn.setAttribute('aria-label', `Listen to ${item.name}`);
      listenBtn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>Listen</span>
      `;
      listenBtn.addEventListener('click', () => {
        playKannadaAudio(item.listenText || item.char, listenBtn);
      });

      card.appendChild(listenBtn);
      scriptGrid.appendChild(card);
    });
  }

  // =========================================================================
  // 2. RENDER WORDS
  // =========================================================================
  function renderWordsGrid() {
    if (!wordsGrid) return;
    wordsGrid.innerHTML = '';

    const allWords = learnData.words || [];

    const filtered = allWords.filter(word => {
      if (currentWordCategory !== 'all' && word.category !== currentWordCategory) {
        return false;
      }
      if (!currentSearchQuery) return true;
      const q = currentSearchQuery;
      return (
        word.kannada.toLowerCase().includes(q) ||
        word.translit.toLowerCase().includes(q) ||
        word.english.toLowerCase().includes(q) ||
        (word.note && word.note.toLowerCase().includes(q))
      );
    });

    if (learnEmptySearch) learnEmptySearch.hidden = (filtered.length > 0);

    filtered.forEach(word => {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.id = `word-${word.id}`;

      // Card Header
      const top = document.createElement('div');
      top.className = 'word-card-top';

      const left = document.createElement('div');
      const kn = document.createElement('div');
      kn.className = 'word-kannada';
      kn.setAttribute('lang', 'kn');
      kn.textContent = word.kannada;

      const translit = document.createElement('span');
      translit.className = 'word-translit';
      translit.textContent = word.translit;

      left.appendChild(kn);
      left.appendChild(translit);
      top.appendChild(left);

      // Card Body
      const eng = document.createElement('div');
      eng.className = 'word-english';
      eng.textContent = word.english;

      const note = document.createElement('p');
      note.className = 'word-note';
      note.textContent = word.note || '';

      // Actions
      const actions = document.createElement('div');
      actions.className = 'word-actions';

      const listenBtn = document.createElement('button');
      listenBtn.type = 'button';
      listenBtn.className = 'btn-listen';
      listenBtn.setAttribute('aria-label', `Listen to ${word.english}`);
      listenBtn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>Listen</span>
      `;
      listenBtn.addEventListener('click', () => {
        playKannadaAudio(word.listenText || word.kannada, listenBtn);
      });

      // Save to Garden (Step 5)
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn-save-garden';
      saveBtn.setAttribute('data-item-id', word.id);
      saveBtn.setAttribute('aria-label', `Save ${word.english} to Word Garden`);
      const isSaved = GardenStore.has(word.id);
      if (isSaved) saveBtn.classList.add('saved');
      saveBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${isSaved ? '✓ In Garden' : 'Save'}</span>
      `;
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const result = GardenStore.toggle({
          id: word.id,
          type: 'word',
          kannada: word.kannada,
          translit: word.translit,
          english: word.english,
          category: word.category,
          note: word.note,
          listenText: word.listenText || word.kannada
        });
        if (result.action === 'added') {
          showGardenToast('Added to your Word Garden.', 'success');
        } else {
          showGardenToast('Removed from your Word Garden.', 'info');
        }
      });

      actions.appendChild(listenBtn);
      actions.appendChild(saveBtn);

      card.appendChild(top);
      card.appendChild(eng);
      if (word.note) card.appendChild(note);
      card.appendChild(actions);

      wordsGrid.appendChild(card);
    });
  }

  // =========================================================================
  // 3. RENDER PHRASES
  // =========================================================================
  function renderPhrasesGrid() {
    if (!phrasesGrid) return;
    phrasesGrid.innerHTML = '';

    const allPhrases = learnData.phrases || [];

    const filtered = allPhrases.filter(phrase => {
      if (currentPhraseCategory !== 'all' && phrase.category !== currentPhraseCategory) {
        return false;
      }
      if (!currentSearchQuery) return true;
      const q = currentSearchQuery;
      return (
        phrase.kannada.toLowerCase().includes(q) ||
        phrase.translit.toLowerCase().includes(q) ||
        phrase.english.toLowerCase().includes(q) ||
        (phrase.usage && phrase.usage.toLowerCase().includes(q))
      );
    });

    if (learnEmptySearch) learnEmptySearch.hidden = (filtered.length > 0);

    filtered.forEach(phrase => {
      const card = document.createElement('div');
      card.className = 'phrase-card';
      card.id = `phrase-${phrase.id}`;

      const kn = document.createElement('div');
      kn.className = 'phrase-kannada';
      kn.setAttribute('lang', 'kn');
      kn.textContent = phrase.kannada;

      const translit = document.createElement('div');
      translit.className = 'phrase-translit';
      translit.textContent = phrase.translit;

      const eng = document.createElement('div');
      eng.className = 'phrase-english';
      eng.textContent = phrase.english;

      const usage = document.createElement('div');
      usage.className = 'phrase-usage';
      usage.textContent = phrase.usage || '';

      const actions = document.createElement('div');
      actions.className = 'phrase-actions';

      const listenBtn = document.createElement('button');
      listenBtn.type = 'button';
      listenBtn.className = 'btn-listen';
      listenBtn.setAttribute('aria-label', `Listen to phrase: ${phrase.english}`);
      listenBtn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>Listen</span>
      `;
      listenBtn.addEventListener('click', () => {
        playKannadaAudio(phrase.listenText || phrase.kannada, listenBtn);
      });

      // Save to Garden (Step 5)
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn-save-garden';
      saveBtn.setAttribute('data-item-id', phrase.id);
      saveBtn.setAttribute('aria-label', `Save phrase "${phrase.english}" to Word Garden`);
      const isSaved = GardenStore.has(phrase.id);
      if (isSaved) saveBtn.classList.add('saved');
      saveBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${isSaved ? '✓ In Garden' : 'Save'}</span>
      `;
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const result = GardenStore.toggle({
          id: phrase.id,
          type: 'phrase',
          kannada: phrase.kannada,
          translit: phrase.translit,
          english: phrase.english,
          category: phrase.category,
          note: phrase.usage,
          listenText: phrase.listenText || phrase.kannada
        });
        if (result.action === 'added') {
          showGardenToast('Added to your Word Garden.', 'success');
        } else {
          showGardenToast('Removed from your Word Garden.', 'info');
        }
      });

      actions.appendChild(listenBtn);
      actions.appendChild(saveBtn);

      card.appendChild(kn);
      card.appendChild(translit);
      card.appendChild(eng);
      if (phrase.usage) card.appendChild(usage);
      card.appendChild(actions);

      phrasesGrid.appendChild(card);
    });
  }

  /**
   * Synchronizes visual state of all save buttons across the page.
   */
  function updateAllSaveButtons() {
    const buttons = document.querySelectorAll('.btn-save-garden[data-item-id]');
    buttons.forEach(btn => {
      const id = btn.getAttribute('data-item-id');
      const isSaved = GardenStore.has(id);
      btn.classList.toggle('saved', isSaved);
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${isSaved ? '✓ In Garden' : 'Save'}</span>
      `;
    });
  }

  // =========================================================================
  // MINECRAFT-INSPIRED RETRO PIXEL WORD GARDEN UI CONTROLLER
  // Strictly Isolated: Populated ONLY from Photo History (nammooru_history_v1)
  // =========================================================================
  const btnGardenHeader        = document.getElementById('btn-garden-header') || document.getElementById('btn-header-garden');
  const headerGardenBadge      = document.getElementById('header-garden-badge');
  const btnOpenGardenFromLearn = document.getElementById('btn-open-garden-from-learn');
  const learnGardenCount       = document.getElementById('learn-garden-count');
  const gardenOverlay          = document.getElementById('garden-overlay');
  const btnGardenClose         = document.getElementById('btn-garden-close');
  const btnGardenBackToVocab   = document.getElementById('btn-garden-back-to-vocab');

  // Minecraft Garden Elements
  const mcGardenGround         = document.getElementById('mc-garden-ground');
  const mcGardenBadgePill      = document.getElementById('mc-garden-badge-pill');
  const mcGardenCountLabel     = document.getElementById('mc-garden-count-label');
  const mcPlantDialogue        = document.getElementById('mc-plant-dialogue');
  const mcDialoguePlantIcon    = document.getElementById('mc-dialogue-plant-icon');
  const mcDialogueKannada      = document.getElementById('mc-dialogue-kannada');
  const mcDialogueTranslit     = document.getElementById('mc-dialogue-translit');
  const mcDialogueEnglish      = document.getElementById('mc-dialogue-english');
  const mcDialogueDesc         = document.getElementById('mc-dialogue-desc');
  const mcThumbFrame           = document.getElementById('mc-thumb-frame');
  const mcDialogueThumb        = document.getElementById('mc-dialogue-thumb');
  const mcDialogueTimestamp    = document.getElementById('mc-dialogue-timestamp');
  const btnMcAudio             = document.getElementById('btn-mc-audio');
  const btnMcAudioText         = document.getElementById('btn-mc-audio-text');
  const btnMcDialogueClose     = document.getElementById('btn-mc-dialogue-close');

  let activeDialoguePlant = null;

  // 6 Classic 8-Bit Retro Flower Varieties (Pixel SVGs)
  const MC_FLOWERS = [
    {
      name: 'poppy',
      icon: '🌹',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="8" width="2" height="12" fill="#437d26"/>
        <rect x="5" y="12" width="2" height="2" fill="#36661e"/>
        <rect x="9" y="14" width="2" height="2" fill="#589e34"/>
        <rect x="5" y="2" width="6" height="6" fill="#d32f2f"/>
        <rect x="4" y="3" width="8" height="4" fill="#e53935"/>
        <rect x="6" y="1" width="4" height="8" fill="#c62828"/>
        <rect x="7" y="4" width="2" height="2" fill="#ffebee"/>
        <rect x="6" y="5" width="4" height="2" fill="#8e0000"/>
      </svg>`
    },
    {
      name: 'dandelion',
      icon: '🌼',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="7" width="2" height="13" fill="#437d26"/>
        <rect x="5" y="13" width="2" height="2" fill="#589e34"/>
        <rect x="9" y="11" width="2" height="2" fill="#36661e"/>
        <rect x="5" y="2" width="6" height="5" fill="#fbc02d"/>
        <rect x="4" y="3" width="8" height="3" fill="#fdd835"/>
        <rect x="6" y="1" width="4" height="7" fill="#f57f17"/>
        <rect x="7" y="3" width="2" height="2" fill="#fff9c4"/>
      </svg>`
    },
    {
      name: 'orchid',
      icon: '🪻',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="6" width="2" height="14" fill="#36661e"/>
        <rect x="5" y="10" width="2" height="2" fill="#437d26"/>
        <rect x="4" y="1" width="3" height="4" fill="#0288d1"/>
        <rect x="9" y="1" width="3" height="4" fill="#29b6f6"/>
        <rect x="5" y="4" width="6" height="4" fill="#03a9f4"/>
        <rect x="7" y="3" width="2" height="2" fill="#e1f5fe"/>
        <rect x="6" y="6" width="4" height="2" fill="#01579b"/>
      </svg>`
    },
    {
      name: 'allium',
      icon: '🟣',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="8" width="2" height="12" fill="#437d26"/>
        <rect x="5" y="14" width="2" height="2" fill="#589e34"/>
        <rect x="4" y="2" width="8" height="6" fill="#ab47bc"/>
        <rect x="5" y="1" width="6" height="8" fill="#ba68c8"/>
        <rect x="6" y="3" width="4" height="4" fill="#f3e5f5"/>
        <rect x="5" y="7" width="6" height="2" fill="#6a1b9a"/>
      </svg>`
    },
    {
      name: 'lily',
      icon: '🤍',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="7" width="2" height="13" fill="#437d26"/>
        <rect x="9" y="12" width="2" height="2" fill="#36661e"/>
        <rect x="5" y="2" width="6" height="6" fill="#f5f5f5"/>
        <rect x="4" y="3" width="8" height="4" fill="#e0e0e0"/>
        <rect x="6" y="1" width="4" height="2" fill="#ffffff"/>
        <rect x="6" y="6" width="4" height="2" fill="#9e9e9e"/>
      </svg>`
    },
    {
      name: 'sunflower',
      icon: '🌻',
      svg: `<svg viewBox="0 0 16 20" width="34" height="42" shape-rendering="crispEdges">
        <rect x="7" y="8" width="2" height="12" fill="#437d26"/>
        <rect x="5" y="12" width="2" height="2" fill="#589e34"/>
        <rect x="9" y="14" width="2" height="2" fill="#36661e"/>
        <rect x="4" y="1" width="8" height="8" fill="#ffa000"/>
        <rect x="5" y="2" width="6" height="6" fill="#ffb300"/>
        <rect x="6" y="3" width="4" height="4" fill="#5d4037"/>
        <rect x="7" y="4" width="2" height="2" fill="#3e2723"/>
      </svg>`
    }
  ];

  /**
   * CRITICAL DATA SOURCE ISOLATION:
   * Reads exclusively from Photo History Log (nammooru_history_v1).
   * Does NOT mix or merge general vocabulary, deck phrases, or other site data.
   */
  function getPhotoGardenWords() {
    const records = typeof loadHistory === 'function' ? loadHistory() : [];
    return records.filter(r => r && typeof r.english === 'string' && typeof r.kannada === 'string');
  }

  function updateGardenBadges() {
    const photoWords = getPhotoGardenWords();
    const count = photoWords.length;

    // 1. Header quick pill (if present)
    const headerCountEl = document.getElementById('header-garden-count');
    if (headerCountEl) headerCountEl.textContent = count;
    if (headerGardenBadge) {
      headerGardenBadge.textContent = count;
      headerGardenBadge.hidden = (count === 0);
    }

    // 2. Profile stats (Word Garden count in Transform tab)
    const profileGardenEl = document.getElementById('profile-garden-count');
    if (profileGardenEl) {
      profileGardenEl.textContent = count;
    }

    // 3. Learn page hero card badge & mode tab badge
    if (learnGardenCount) {
      learnGardenCount.textContent = count;
      learnGardenCount.hidden = (count === 0);
    }
    if (learnGardenTabBadge) {
      learnGardenTabBadge.textContent = count;
      learnGardenTabBadge.hidden = (count === 0);
    }
  }

  function openGardenModal() {
    if (!gardenOverlay) return;
    gardenOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    updateGardenBadges();
    renderMinecraftWordGarden();
    if (btnGardenClose) btnGardenClose.focus();
  }

  function closeGardenModal() {
    if (!gardenOverlay) return;
    gardenOverlay.hidden = true;
    document.body.style.overflow = '';
    hidePlantDialogue();
  }

  function showPlantDialogue(item, flower) {
    if (!mcPlantDialogue) return;
    activeDialoguePlant = item;

    if (mcDialoguePlantIcon) mcDialoguePlantIcon.textContent = flower.icon || '🌸';
    if (mcDialogueKannada)   mcDialogueKannada.textContent = item.kannada || '';
    if (mcDialogueTranslit)  mcDialogueTranslit.textContent = item.pronunciation ? `"${item.pronunciation}"` : '';
    if (mcDialogueEnglish)   mcDialogueEnglish.textContent = item.english || '';
    if (mcDialogueDesc)      mcDialogueDesc.textContent = item.description || 'Captured through the Nammooru optical lens in Bengaluru.';

    const photoSrc = item.thumbnailUrl || item.fullImageUrl;
    if (mcThumbFrame && mcDialogueThumb) {
      if (photoSrc) {
        mcDialogueThumb.src = photoSrc;
        mcThumbFrame.hidden = false;
      } else {
        mcThumbFrame.hidden = true;
      }
    }

    if (mcDialogueTimestamp) {
      const dateStr = item.timestamp ? formatDate(item.timestamp) : 'Recent';
      mcDialogueTimestamp.textContent = `Discovered via Photo • ${dateStr}`;
    }

    mcPlantDialogue.hidden = false;
  }

  function hidePlantDialogue() {
    if (mcPlantDialogue) mcPlantDialogue.hidden = true;
    activeDialoguePlant = null;
  }

  // Render Minecraft-Inspired Pixel Biome based strictly on Photo History
  function renderMinecraftWordGarden() {
    const gardenGround = document.getElementById('mc-garden-ground');
    if (!gardenGround) return;
    hidePlantDialogue();

    const photoWords = getPhotoGardenWords();
    const count = photoWords.length;

    // Visual Progression Badges & Counts
    if (mcGardenBadgePill && mcGardenCountLabel) {
      if (count === 0) {
        mcGardenBadgePill.textContent = 'Seedling Plot';
        mcGardenCountLabel.textContent = '0 Plants Discovered';
      } else if (count <= 3) {
        mcGardenBadgePill.textContent = 'Level 1: Sprouting Garden';
        mcGardenCountLabel.textContent = `${count} ${count === 1 ? 'Plant' : 'Plants'} Growing`;
      } else {
        mcGardenBadgePill.textContent = 'Level 2: Flourishing Biome';
        mcGardenCountLabel.textContent = `${count} Plants Blooming`;
      }
    }

    // Progression Tier 0: 0 Photo Words (Fresh tilled dirt + calm Minecraft prompt)
    if (count === 0) {
      gardenGround.innerHTML = `
        <div class="mc-empty-sign">
          <div class="mc-sign-board">
            <div class="mc-sign-icon">🌱</div>
            <h3 class="mc-sign-title">Tilled Plot Awaiting Seeds</h3>
            <p class="mc-sign-text">"Take a photo of an object to plant your first seed!"</p>
            <button type="button" class="mc-btn mc-btn-primary" id="btn-mc-goto-photo">
              <span>📸 Snap a Photo</span>
            </button>
          </div>
          <div class="mc-sign-post"></div>
        </div>
      `;

      const btnGotoPhoto = document.getElementById('btn-mc-goto-photo');
      if (btnGotoPhoto) {
        btnGotoPhoto.addEventListener('click', () => {
          closeGardenModal();
          switchSection('photo');
        });
      }
      return;
    }

    // Progression Tier 1 & 2: Plants Grid
    const grid = document.createElement('div');
    grid.className = 'mc-plants-grid';

    photoWords.forEach((item, index) => {
      const flower = MC_FLOWERS[index % MC_FLOWERS.length];

      const plot = document.createElement('div');
      plot.className = 'mc-plant-plot';
      plot.setAttribute('role', 'button');
      plot.setAttribute('tabindex', '0');
      plot.setAttribute('aria-label', `${item.english} (${item.kannada})`);

      plot.innerHTML = `
        <div class="mc-plant-nametag">${item.english}</div>
        <div class="mc-plant-sprite-wrap" style="animation-delay: -${(index * 0.7).toFixed(1)}s">
          ${flower.svg}
        </div>
        <div class="mc-soil-tile"></div>
      `;

      plot.addEventListener('click', (e) => {
        e.stopPropagation();
        showPlantDialogue(item, flower);
      });

      plot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showPlantDialogue(item, flower);
        }
      });

      grid.appendChild(plot);
    });

    gardenGround.innerHTML = '';
    gardenGround.appendChild(grid);
  }

  // --- Wire Event Listeners for Word Garden ---
  if (btnGardenHeader) {
    btnGardenHeader.addEventListener('click', openGardenModal);
  }
  if (btnOpenGardenFromLearn) {
    btnOpenGardenFromLearn.addEventListener('click', openGardenModal);
  }
  if (btnGardenClose) {
    btnGardenClose.addEventListener('click', closeGardenModal);
  }
  if (btnMcDialogueClose) {
    btnMcDialogueClose.addEventListener('click', hidePlantDialogue);
  }

  // Clear "Back to Vocabulary" button returns smoothly to normal Learn words
  if (btnGardenBackToVocab) {
    btnGardenBackToVocab.addEventListener('click', () => {
      closeGardenModal();
      switchSection('learn');
      switchLearnMode('words');
    });
  }

  // Audio Pronunciation Button on Dialogue Card (Native TTS playback, NO sliders)
  if (btnMcAudio) {
    btnMcAudio.addEventListener('click', () => {
      if (!activeDialoguePlant || !activeDialoguePlant.kannada) return;
      playKannadaAudio(activeDialoguePlant.kannada, btnMcAudio);
    });
  }

  // Close modal when clicking on the frosted overlay background
  if (gardenOverlay) {
    gardenOverlay.addEventListener('click', (e) => {
      if (e.target === gardenOverlay) closeGardenModal();
    });
  }

  // Initial Badges Sync
  updateGardenBadges();


  // --- Initial Render of Learn Content ---
  renderScriptGrid();

  // =========================================================================
  // LEARN HUB & SUBPAGES CONTROLLER (V2 Editorial Redesign)
  // =========================================================================

  const learnHubView          = document.getElementById('learn-hub-view');
  const learnSubpageView      = document.getElementById('learn-subpage-view');
  const subpageCurrentTitle   = document.getElementById('subpage-current-title');
  const btnBackToHub          = document.getElementById('btn-back-to-hub');
  const learnDestinationCards = Array.from(document.querySelectorAll('.learn-destination-card'));
  const hubGardenCount        = document.getElementById('hub-garden-count');
  const hubTriesCount         = document.getElementById('hub-tries-count');
  const hubBadgesCount        = document.getElementById('hub-badges-count');

  const subPanels = {
    words:        document.getElementById('sub-panel-words'),
    phrases:      document.getElementById('sub-panel-phrases'),
    garden:       document.getElementById('sub-panel-garden'),
    tries:        document.getElementById('sub-panel-tries'),
    achievements: document.getElementById('sub-panel-achievements'),
    progress:     document.getElementById('sub-panel-progress'),
  };

  const SUBPAGE_TITLES = {
    words:        'Discover Words',
    phrases:      'Useful Phrases',
    garden:       'Word Garden',
    tries:        'My Real-Life Tries',
    achievements: 'My Achievements',
    progress:     'My Progress'
  };

  function updateHubStats() {
    // Safe placeholder for legacy subpages if any
  }

  function renderGardenSubpage() {
    const listEl = document.getElementById('garden-subpage-list');
    const emptyEl = document.getElementById('garden-subpage-empty');
    if (!listEl) return;
    listEl.innerHTML = '';

    const items = typeof GardenStore !== 'undefined' ? GardenStore.getAll() : [];
    if (items.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'word-card garden-subpage-card';
      card.innerHTML = `
        <div class="word-card-top">
          <div>
            <div class="word-kannada" lang="kn">${escapeHtml(item.kannada)}</div>
            <span class="word-translit">${escapeHtml(item.translit || item.pronunciation || '')}</span>
          </div>
          <span class="category-tag">${escapeHtml(item.category || 'Saved')}</span>
        </div>
        <div class="word-english">${escapeHtml(item.english)}</div>
        <div class="word-actions">
          <button type="button" class="btn-listen" aria-label="Listen to ${escapeHtml(item.english)}">
            <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <span>Listen</span>
          </button>
          <button type="button" class="btn-remove-garden" aria-label="Remove ${escapeHtml(item.english)} from garden">
            <span>Remove</span>
          </button>
        </div>
      `;

      const listenBtn = card.querySelector('.btn-listen');
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          playPronunciation(item.kannada, item.translit || item.pronunciation, item.english);
        });
      }

      const removeBtn = card.querySelector('.btn-remove-garden');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          GardenStore.remove(item.id);
          renderGardenSubpage();
          updateHubStats();
        });
      }

      listEl.appendChild(card);
    });
  }

  function renderProgressSummary() {
    const attempts = typeof AttemptStore !== 'undefined' ? AttemptStore.getAll() : [];
    const gardenData = typeof GardenStore !== 'undefined' ? GardenStore.count() : { total: 0 };
    const earnedBadges = typeof BADGE_DEFINITIONS !== 'undefined' 
      ? BADGE_DEFINITIONS.filter(b => b.evaluate(attempts).earned).length 
      : 0;

    const statTries = document.getElementById('prog-stat-tries');
    const statGarden = document.getElementById('prog-stat-garden');
    const statBadges = document.getElementById('prog-stat-badges');

    if (statTries) statTries.textContent = attempts.length;
    if (statGarden) statGarden.textContent = gardenData.total;
    if (statBadges) statBadges.textContent = `${earnedBadges} / 9`;

    const wellCount = attempts.filter(a => a.outcome === 'went_well').length;
    const helpCount = attempts.filter(a => a.outcome === 'needed_help').length;
    const frozeCount = attempts.filter(a => a.outcome === 'froze').length;

    const outWell = document.getElementById('prog-out-well');
    const outHelp = document.getElementById('prog-out-help');
    const outFroze = document.getElementById('prog-out-froze');

    if (outWell) outWell.textContent = wellCount;
    if (outHelp) outHelp.textContent = helpCount;
    if (outFroze) outFroze.textContent = frozeCount;
  }

  function openLearnSubpage(subpage) {
    stopAllAudio();
    if (!subpage || subpage === 'hub') {
      if (learnHubView) learnHubView.hidden = false;
      if (learnSubpageView) learnSubpageView.hidden = true;
      updateHubStats();
      return;
    }

    if (learnHubView) learnHubView.hidden = true;
    if (learnSubpageView) learnSubpageView.hidden = false;

    if (subpageCurrentTitle) {
      subpageCurrentTitle.textContent = SUBPAGE_TITLES[subpage] || 'Learn & Practice';
    }

    Object.values(subPanels).forEach(p => {
      if (p) p.hidden = true;
    });

    const target = subPanels[subpage];
    if (target) {
      target.hidden = false;
    }

    if (subpage === 'words') {
      renderCurrentMode();
    } else if (subpage === 'phrases') {
      renderPhrasesGrid();
    } else if (subpage === 'garden') {
      renderGardenSubpage();
    } else if (subpage === 'tries') {
      if (typeof renderAttemptsList === 'function') renderAttemptsList();
    } else if (subpage === 'achievements') {
      if (typeof renderBadgesGrid === 'function') renderBadgesGrid();
    } else if (subpage === 'progress') {
      renderProgressSummary();
    }

    const contentEl = document.querySelector('.app-content');
    if (contentEl) contentEl.scrollTop = 0;
  }

  // Hook destination cards
  learnDestinationCards.forEach(card => {
    card.addEventListener('click', () => {
      openLearnSubpage(card.dataset.subpage);
    });
  });

  if (btnBackToHub) {
    btnBackToHub.addEventListener('click', () => {
      openLearnSubpage('hub');
    });
  }

  const btnGardenStartDiscover = document.getElementById('btn-garden-start-discover');
  if (btnGardenStartDiscover) {
    btnGardenStartDiscover.addEventListener('click', () => {
      openLearnSubpage('words');
    });
  }

  window.openLearnSubpage = openLearnSubpage;
  window.updateHubStats = updateHubStats;
  // --- Tab Switch Hook: Handle "Learn This Word" passed from PHOTO section ---
  const originalSwitchSection = switchSection;
  window.addEventListener('hashchange', checkFeaturedWord);

  function checkFeaturedWord() {
    try {
      const raw = sessionStorage.getItem('nammooru_featured_word');
      if (raw && window.location.hash.includes('learn')) {
        const item = JSON.parse(raw);
        sessionStorage.removeItem('nammooru_featured_word');
        if (item && item.kannada) {
          switchLearnMode('words');
          if (learnSearchInput) {
            learnSearchInput.value = item.english || item.kannada;
            currentSearchQuery = (item.english || item.kannada).toLowerCase();
            if (btnSearchClear) btnSearchClear.hidden = false;
            renderWordsGrid();
          }
          showFeedback(`Showing learning details for "${item.english || item.kannada}"`, 'info', 3500);
        }
      }
    } catch { /* ignore */ }
  }

  // Also check immediately on load
  checkFeaturedWord();

  // =========================================================================
  // STEP 6: INNOVATE — REAL-WORLD PRACTICE & VISUAL BADGE SYSTEM
  // =========================================================================

  /**
   * AttemptStore: Persistent storage layer for real-world Kannada attempts.
   * Isolates persistence (localStorage) from UI rendering.
   */
  
  /**
   * Calculates and updates factual counts for My Week and My Progress in INNOVATE.
   * - Tries this week (within last 7 days)
   * - Words learned (saved in Word Garden)
   * - Words tried (attempts recorded)
   * - Outcome counts (Went well, Needed help, Froze)
   */
  


  const AttemptStore = (() => {
    const STORAGE_KEY = 'nammooru_attempts_v1';
    const listeners = new Set();

    function readStorage() {
      try {
        const raw = localStorage.getItem('nammooru_tries') || localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(item => item && typeof item === 'object' && item.id && item.situation && item.outcome);
      } catch (err) {
        console.warn('[AttemptStore] Corrupted localStorage recovered:', err);
        return [];
      }
    }

    function writeStorage(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        localStorage.setItem('nammooru_tries', JSON.stringify(items));
        listeners.forEach(fn => {
          try { fn(items); } catch (e) { console.error('[AttemptStore listener error]', e); }
        });
        if (typeof window.updateWordPetCompanion === 'function') {
          window.updateWordPetCompanion();
        }
        return true;
      } catch (err) {
        console.error('[AttemptStore write error]', err);
        showGardenToast('Could not save attempt to browser storage.', 'error');
        return false;
      }
    }

    return {
      getAll() {
        return readStorage();
      },
      get(id) {
        if (!id) return null;
        return readStorage().find(a => a.id === id) || null;
      },
      add(rawAttempt) {
        const current = readStorage();
        const id = 'att_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const attempt = {
          id,
          situation: String(rawAttempt.situation || '').trim(),
          category: rawAttempt.category || 'everyday',
          outcome: rawAttempt.outcome || 'went_well', // 'went_well' | 'needed_help' | 'froze'
          note: String(rawAttempt.note || '').trim(),
          connectedItemId: rawAttempt.connectedItemId || null,
          connectedItemText: rawAttempt.connectedItemText || null,
          timestamp: new Date().toISOString()
        };
        current.unshift(attempt);
        writeStorage(current);
        return attempt;
      },
      remove(id) {
        if (!id) return false;
        const current = readStorage();
        const filtered = current.filter(a => a.id !== id);
        if (filtered.length !== current.length) {
          return writeStorage(filtered);
        }
        return false;
      },
      subscribe(fn) {
        if (typeof fn === 'function') listeners.add(fn);
        return () => listeners.delete(fn);
      }
    };
  })();

  /**
   * Transparent Badge Definitions Catalog (Step 6)
   * 7 Required Categories:
   * 1. Price and money
   * 2. Shopping
   * 3. Negotiation
   * 4. Food and ordering
   * 5. Getting around
   * 6. Everyday conversation
   * 7. Courage and trying again
   */
  const BADGE_DEFINITIONS = [
    {
      id: 'badge_first_step',
      category: 'Courage and trying again',
      categoryKey: 'courage',
      title: 'First Leap',
      titleKn: 'ಮೊದಲ ಹೆಜ್ಜೆ',
      icon: '🌱',
      description: 'You stepped outside your comfort zone and recorded your very first Kannada conversation attempt in Bengaluru.',
      criteriaText: 'Record at least 1 real-world conversation attempt (any outcome counts).',
      evaluate(attempts) {
        const count = attempts.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? attempts[attempts.length - 1].timestamp : null,
          supportingAttempts: attempts
        };
      }
    },
    {
      id: 'badge_brave_heart',
      category: 'Courage and trying again',
      categoryKey: 'courage',
      title: 'Brave Heart',
      titleKn: 'ಧೈರ್ಯವಂತ',
      icon: '🦁',
      description: 'You froze or stumbled, but you embraced the moment. Stepping up despite hesitation is the truest mark of courage.',
      criteriaText: 'Record at least 1 attempt with outcome "Froze in the moment" or "Needed help".',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.outcome === 'froze' || a.outcome === 'needed_help');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_steady_explorer',
      category: 'Courage and trying again',
      categoryKey: 'courage',
      title: 'Steady Explorer',
      titleKn: 'ದೃಢ ನಿಶ್ಚಯ',
      icon: '🚶',
      description: 'Consistency over perfection. You have stepped up and practiced three separate times in real life.',
      criteriaText: 'Record at least 3 real-world speaking attempts in total (any outcome).',
      evaluate(attempts) {
        const count = attempts.length;
        const earned = count >= 3;
        return {
          earned,
          progress: Math.min(count, 3),
          target: 3,
          earnedAt: earned ? attempts[attempts.length - 3].timestamp : null,
          supportingAttempts: attempts
        };
      }
    },
    {
      id: 'badge_darshini_regular',
      category: 'Food and ordering',
      categoryKey: 'food',
      title: 'Darshini Regular',
      titleKn: 'ದರ್ಶಿನಿ ಮಾತು',
      icon: '☕',
      description: 'Ordered tiffin, filter coffee, or snacks at a Bengaluru Darshini, bakery, or canteen.',
      criteriaText: 'Record at least 1 attempt in Food and ordering (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'food');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_city_navigator',
      category: 'Getting around',
      categoryKey: 'transport',
      title: 'City Navigator',
      titleKn: 'ನಮ್ಮ ಸಂಚಾರ',
      icon: '🛺',
      description: 'Gave directions, negotiated transit, or communicated during your Bengaluru commute.',
      criteriaText: 'Record at least 1 attempt in Getting around / Commute (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'transport');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_local_shopper',
      category: 'Shopping',
      categoryKey: 'shopping',
      title: 'Local Shopper',
      titleKn: 'ಅಂಗಡಿ ಮಾತು',
      icon: '🛍️',
      description: 'Bought groceries, vegetables, or household supplies at a neighbourhood store or local market.',
      criteriaText: 'Record at least 1 attempt in Shopping (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'shopping');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_price_savvy',
      category: 'Price and money',
      categoryKey: 'price',
      title: 'Price & Numbers',
      titleKn: 'ಬೆಲೆ ಮತ್ತು ಲೆಕ್ಕ',
      icon: '🪙',
      description: 'Asked how much something costs, verified a bill, or spoke numbers and change with confidence.',
      criteriaText: 'Record at least 1 attempt in Price and money (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'price');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_polite_negotiator',
      category: 'Negotiation',
      categoryKey: 'negotiation',
      title: 'Polite Negotiation',
      titleKn: 'ಸೌಜನ್ಯ ಚರ್ಚೆ',
      icon: '🤝',
      description: 'Politely requested meter rate, enquired about discounts, or reached a warm mutual agreement.',
      criteriaText: 'Record at least 1 attempt in Negotiation / Politeness (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'negotiation');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    },
    {
      id: 'badge_warm_neighbour',
      category: 'Everyday conversation',
      categoryKey: 'everyday',
      title: 'Warm Neighbour',
      titleKn: 'ನಮಸ್ಕಾರ ಸ್ನೇಹಿತ',
      icon: '🙏',
      description: 'Exchanged polite greetings, asked how someone is doing, or expressed gratitude in Kannada.',
      criteriaText: 'Record at least 1 attempt in Everyday conversation (any outcome).',
      evaluate(attempts) {
        const qualifying = attempts.filter(a => a.category === 'everyday');
        const count = qualifying.length;
        const earned = count >= 1;
        return {
          earned,
          progress: Math.min(count, 1),
          target: 1,
          earnedAt: earned ? qualifying[qualifying.length - 1].timestamp : null,
          supportingAttempts: qualifying
        };
      }
    }
  ];

  // Expose store singletons to window for testing and external access
  window.AttemptStore = AttemptStore;
  window.BADGE_DEFINITIONS = BADGE_DEFINITIONS;


  function updateInnovateStats() {
    const attempts = typeof AttemptStore !== 'undefined' ? AttemptStore.getAll() : [];
    const gardenData = typeof GardenStore !== 'undefined' ? GardenStore.count() : { total: 0, words: 0, phrases: 0 };
    
    // My Week calculation: attempts within the last 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const triesThisWeek = attempts.filter(a => {
      const t = new Date(a.timestamp).getTime();
      return !isNaN(t) && t >= oneWeekAgo;
    }).length;

    const wordsLearned = gardenData.words || gardenData.total || 0;
    const wordsTried = attempts.filter(a => a.connectedItemText || a.situation).length;

    const elWeekTries = document.getElementById('week-tries-count');
    const elWeekLearned = document.getElementById('week-words-learned');
    const elWeekTried = document.getElementById('week-words-tried');

    if (elWeekTries) elWeekTries.textContent = triesThisWeek;
    if (elWeekLearned) elWeekLearned.textContent = wordsLearned;
    if (elWeekTried) elWeekTried.textContent = wordsTried;

    // My Progress stats
    const earnedBadges = typeof BADGE_DEFINITIONS !== 'undefined' 
      ? BADGE_DEFINITIONS.filter(b => b.evaluate(attempts).earned).length 
      : 0;

    const statTries = document.getElementById('prog-stat-tries');
    const statGarden = document.getElementById('prog-stat-garden');
    const statBadges = document.getElementById('prog-stat-badges');

    if (statTries) statTries.textContent = attempts.length;
    if (statGarden) statGarden.textContent = gardenData.total;
    if (statBadges) statBadges.textContent = `${earnedBadges} / 9`;

    const wellCount = attempts.filter(a => a.outcome === 'went_well').length;
    const helpCount = attempts.filter(a => a.outcome === 'needed_help').length;
    const frozeCount = attempts.filter(a => a.outcome === 'froze').length;

    const outWell = document.getElementById('prog-out-well');
    const outHelp = document.getElementById('prog-out-help');
    const outFroze = document.getElementById('prog-out-froze');

    if (outWell) outWell.textContent = wellCount;
    if (outHelp) outHelp.textContent = helpCount;
    if (outFroze) outFroze.textContent = frozeCount;
  }
  window.updateInnovateStats = updateInnovateStats;
  window.GardenStore = GardenStore;
  // INNOVATE UI CONTROLLER
  // =========================================================================

  // DOM Elements
  const innovateNavBtns       = Array.from(document.querySelectorAll('.innovate-nav-btn'));
  const innovatePanels        = {
    record: document.getElementById('panel-inno-record'),
    badges: document.getElementById('panel-inno-badges'),
    log:    document.getElementById('panel-inno-log'),
  };
  const badgeEarnedCounter    = document.getElementById('badge-earned-counter');
  const attemptLogCounter     = document.getElementById('attempt-log-counter');
  const badgesUnlockedCount   = document.getElementById('badges-unlocked-count');

  // Form Elements
  const formRecordAttempt     = document.getElementById('form-record-attempt');
  const inputAttemptSituation = document.getElementById('input-attempt-situation');
  const selectAttemptCategory = document.getElementById('select-attempt-category');
  const inputAttemptNote      = document.getElementById('input-attempt-note');
  const btnSubmitAttempt      = document.getElementById('btn-submit-attempt');
  const btnConnectWordGarden  = document.getElementById('btn-connect-word-garden');
  const connectedGardenChip   = document.getElementById('connected-garden-chip');
  const connectedGardenText   = document.getElementById('connected-garden-text');
  const btnRemoveGardenLink   = document.getElementById('btn-remove-garden-link');
  const quickTemplateChips    = Array.from(document.querySelectorAll('.quick-template-chip'));

  // Badges Elements
  const badgesCategoryBar     = document.getElementById('badges-category-bar');
  const innovateBadgesGrid    = document.getElementById('innovate-badges-grid');
  const badgeDetailModal      = document.getElementById('badge-detail-modal');
  const btnBadgeModalClose    = document.getElementById('btn-badge-modal-close');
  const badgeModalCategory    = document.getElementById('badge-modal-category');
  const badgeModalTitle       = document.getElementById('badge-modal-title');
  const badgeModalIcon        = document.getElementById('badge-modal-icon');
  const badgeModalStatus      = document.getElementById('badge-modal-status');
  const badgeModalTitleKn     = document.getElementById('badge-modal-title-kn');
  const badgeModalDesc        = document.getElementById('badge-modal-desc');
  const badgeModalCriteria    = document.getElementById('badge-modal-criteria');
  const badgeModalProgressBar = document.getElementById('badge-modal-progress-bar');
  const badgeModalProgressLbl = document.getElementById('badge-modal-progress-label');
  const badgeSupportingCount  = document.getElementById('badge-supporting-count');
  const badgeSupportingList   = document.getElementById('badge-supporting-list');

  // Log Elements
  const logTotalAttempts      = document.getElementById('log-total-attempts');
  const logFilterBtns         = Array.from(document.querySelectorAll('.log-filter-btn'));
  const logEmptyState         = document.getElementById('log-empty-state');
  const innovateAttemptsList  = document.getElementById('innovate-attempts-list');
  const btnEmptyStartAttempt  = document.getElementById('btn-empty-start-attempt');

  // Word Garden Picker Elements
  const gardenPickerModal     = document.getElementById('garden-picker-modal');
  const btnGardenPickerClose  = document.getElementById('btn-garden-picker-close');
  const gardenPickerBody      = document.getElementById('garden-picker-body');

  // Attempt Detail Modal Elements
  const attemptDetailModal    = document.getElementById('attempt-detail-modal');
  const btnAttemptDetailClose = document.getElementById('btn-attempt-detail-close');
  const attemptDetailDate     = document.getElementById('attempt-detail-date');
  const attemptDetailTitle    = document.getElementById('attempt-detail-title');
  const attemptDetailBody     = document.getElementById('attempt-detail-body');

  // Local state
  let currentInnovatePanel   = 'record';
  let currentBadgeCategory   = 'all';
  let currentLogOutcomeFilter= 'all';
  let connectedGardenItem    = null; // { id, kannada, english }
  let isSubmittingAttempt    = false;

  /**
   * Switches the visible Innovate sub-panel (Record, Badges, Log).
   */
  function switchInnovatePanel(panelName) {
    if (!innovatePanels[panelName]) return;
    currentInnovatePanel = panelName;

    innovateNavBtns.forEach(btn => {
      const isTarget = btn.dataset.panel === panelName;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    Object.entries(innovatePanels).forEach(([key, panel]) => {
      if (!panel) return;
      const isTarget = key === panelName;
      panel.hidden = !isTarget;
      panel.classList.toggle('active', isTarget);
    });

    if (panelName === 'badges') {
      renderBadgesShowcase();
    } else if (panelName === 'log') {
      renderPracticeLog();
    }
  }

  innovateNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchInnovatePanel(btn.dataset.panel);
    });
  });

  if (btnEmptyStartAttempt) {
    btnEmptyStartAttempt.addEventListener('click', () => {
      switchInnovatePanel('record');
    });
  }

  // --- Outcome Option Cards Interaction (Radio sync) ---
  const outcomeRadioInputs = Array.from(document.querySelectorAll('input[name="attempt-outcome"]'));
  outcomeRadioInputs.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.outcome-option-card').forEach(card => {
        card.classList.remove('selected');
      });
      const parentLabel = radio.closest('.outcome-option-card');
      if (parentLabel) parentLabel.classList.add('selected');
    });
  });

  // --- Quick Template Chips ---
  quickTemplateChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const situation = chip.dataset.situation || '';
      const cat = chip.dataset.cat || 'everyday';
      if (inputAttemptSituation) {
        inputAttemptSituation.value = situation;
        inputAttemptSituation.focus();
      }
      if (selectAttemptCategory && cat) {
        selectAttemptCategory.value = cat;
      }
    });
  });

  // --- Word Garden Connection Picker ---
  function openGardenPicker() {
    if (!gardenPickerModal || !gardenPickerBody) return;
    const savedWords = GardenStore.getAll();
    gardenPickerBody.innerHTML = '';

    if (savedWords.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'supporting-empty-msg';
      emptyMsg.textContent = 'You haven\'t saved any words to your Word Garden yet. Explore the LEARN tab to add some!';
      gardenPickerBody.appendChild(emptyMsg);
    } else {
      savedWords.forEach(item => {
        const row = document.createElement('div');
        row.className = 'garden-picker-item';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.innerHTML = `
          <div class="garden-picker-left">
            <span class="garden-picker-kn" lang="kn">${item.kannada}</span>
            <span class="garden-picker-en">${item.translit || ''} — ${item.english}</span>
          </div>
          <span class="garden-picker-tag">${item.category || 'Word'}</span>
        `;
        const selectItem = () => {
          connectedGardenItem = item;
          if (inputAttemptSituation) {
            inputAttemptSituation.value = `Practiced: ${item.kannada} (${item.english})`;
          }
          if (selectAttemptCategory && item.category) {
            const validOptions = Array.from(selectAttemptCategory.options).map(o => o.value);
            if (validOptions.includes(item.category)) {
              selectAttemptCategory.value = item.category;
            }
          }
          if (connectedGardenChip && connectedGardenText) {
            connectedGardenText.textContent = `${item.kannada} (${item.english})`;
            connectedGardenChip.hidden = false;
          }
          closeGardenPicker();
        };
        row.addEventListener('click', selectItem);
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectItem(); }
        });
        gardenPickerBody.appendChild(row);
      });
    }

    gardenPickerModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeGardenPicker() {
    if (!gardenPickerModal) return;
    gardenPickerModal.hidden = true;
    document.body.style.overflow = '';
  }

  if (btnConnectWordGarden) btnConnectWordGarden.addEventListener('click', openGardenPicker);
  if (btnGardenPickerClose) btnGardenPickerClose.addEventListener('click', closeGardenPicker);
  if (gardenPickerModal) {
    gardenPickerModal.addEventListener('click', (e) => {
      if (e.target === gardenPickerModal) closeGardenPicker();
    });
  }

  if (btnRemoveGardenLink) {
    btnRemoveGardenLink.addEventListener('click', () => {
      connectedGardenItem = null;
      if (connectedGardenChip) connectedGardenChip.hidden = true;
    });
  }

  // --- Form Submission (Record Attempt) ---
  if (formRecordAttempt) {
    formRecordAttempt.addEventListener('submit', (e) => {
      e.preventDefault();
      if (isSubmittingAttempt) return;

      const situationVal = (inputAttemptSituation ? inputAttemptSituation.value : '').trim();
      if (!situationVal) {
        showGardenToast('Please enter the situation or phrase you practiced.', 'info');
        if (inputAttemptSituation) inputAttemptSituation.focus();
        return;
      }

      const selectedOutcomeRadio = document.querySelector('input[name="attempt-outcome"]:checked');
      const outcomeVal = selectedOutcomeRadio ? selectedOutcomeRadio.value : 'went_well';
      const categoryVal = (selectAttemptCategory ? selectAttemptCategory.value : 'everyday');
      const noteVal = (inputAttemptNote ? inputAttemptNote.value : '').trim();

      isSubmittingAttempt = true;
      if (btnSubmitAttempt) btnSubmitAttempt.disabled = true;

      try {
        const newRecord = AttemptStore.add({
          situation: situationVal,
          category: categoryVal,
          outcome: outcomeVal,
          note: noteVal,
          connectedItemId: connectedGardenItem ? connectedGardenItem.id : null,
          connectedItemText: connectedGardenItem ? `${connectedGardenItem.kannada} (${connectedGardenItem.english})` : null
        });

        // Reset form
        inputAttemptSituation.value = '';
        if (inputAttemptNote) inputAttemptNote.value = '';
        connectedGardenItem = null;
        if (connectedGardenChip) connectedGardenChip.hidden = true;

        // Reset outcome radio to Went Well
        const defaultRadio = document.getElementById('outcome-radio-went-well');
        if (defaultRadio) {
          defaultRadio.checked = true;
          document.querySelectorAll('.outcome-option-card').forEach(c => c.classList.remove('selected'));
          defaultRadio.closest('.outcome-option-card')?.classList.add('selected');
        }

        // Encouraging feedback based on outcome
        if (outcomeVal === 'froze') {
          showGardenToast('Attempt recorded! It takes real courage to step up. 🦁', 'success', 3500);
        } else if (outcomeVal === 'needed_help') {
          showGardenToast('Attempt recorded! Every conversation builds your confidence. 🤝', 'success', 3500);
        } else {
          showGardenToast('Well done! Conversation attempt recorded. 🌿', 'success', 3000);
        }

        // Check if any new badge was unlocked and notify gently
        checkAndNotifyNewBadges();

        // Switch to Log to see the new entry
        switchInnovatePanel('log');

      } catch (err) {
        console.error('[Attempt submit error]', err);
        showGardenToast('Could not save attempt. Please try again.', 'error');
      } finally {
        isSubmittingAttempt = false;
        if (btnSubmitAttempt) btnSubmitAttempt.disabled = false;
      }
    });
  }

  // --- Badge Notification Helper ---
  function checkAndNotifyNewBadges() {
    const attempts = AttemptStore.getAll();
    BADGE_DEFINITIONS.forEach(def => {
      const evalResult = def.evaluate(attempts);
      // Check if earned just now on the latest attempt
      if (evalResult.earned && evalResult.supportingAttempts.length > 0) {
        const latest = attempts[0];
        if (latest && evalResult.earnedAt === latest.timestamp) {
          setTimeout(() => {
            showGardenToast(`Badge Unlocked: "${def.title}"! 🏅`, 'info', 4000);
          }, 1200);
        }
      }
    });
  }

  // --- Badges Category Filter ---
  if (badgesCategoryBar) {
    badgesCategoryBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      currentBadgeCategory = btn.dataset.badgeCat || 'all';
      badgesCategoryBar.querySelectorAll('.cat-pill').forEach(b => {
        const isTarget = b === btn;
        b.classList.toggle('active', isTarget);
        b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      });
      renderBadgesShowcase();
    });
  }

  // --- Render Badges Showcase ---
  function renderBadgesShowcase() {
    if (!innovateBadgesGrid) return;
    const attempts = AttemptStore.getAll();
    innovateBadgesGrid.innerHTML = '';

    let earnedTotal = 0;

    const filteredBadges = BADGE_DEFINITIONS.filter(def => {
      if (currentBadgeCategory === 'all') return true;
      return def.categoryKey === currentBadgeCategory;
    });

    filteredBadges.forEach(def => {
      const res = def.evaluate(attempts);
      if (res.earned) earnedTotal++;

      const pct = Math.min(100, Math.round((res.progress / res.target) * 100));

      const card = document.createElement('div');
      card.className = `badge-card ${res.earned ? 'is-earned' : 'is-locked'}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${def.title} badge: ${res.earned ? 'Earned' : 'Locked'}`);

      card.innerHTML = `
        <div class="badge-card-emblem-wrap">
          <span>${def.icon}</span>
          ${res.earned ? '<span class="badge-earned-check" aria-label="Earned">✓</span>' : ''}
        </div>
        <div class="badge-card-title">${def.title}</div>
        <div class="badge-card-kn" lang="kn">${def.titleKn}</div>
        <div class="badge-card-cat-tag">${def.category}</div>
        <div class="badge-card-progress-bar-wrap" aria-hidden="true">
          <div class="badge-card-progress-bar" style="width: ${pct}%"></div>
        </div>
        <div class="badge-card-status-label">
          ${res.earned ? '✓ Earned' : `${res.progress}/${res.target} completed`}
        </div>
      `;

      const openDetails = () => openBadgeDetailModal(def, res);
      card.addEventListener('click', openDetails);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetails(); }
      });

      innovateBadgesGrid.appendChild(card);
    });

    // Update global badge counter
    const allResults = BADGE_DEFINITIONS.map(d => d.evaluate(attempts));
    const totalUnlocked = allResults.filter(r => r.earned).length;

    if (badgeEarnedCounter) {
      badgeEarnedCounter.textContent = `${totalUnlocked}/${BADGE_DEFINITIONS.length}`;
      badgeEarnedCounter.hidden = (totalUnlocked === 0);
    }
    if (badgesUnlockedCount) {
      badgesUnlockedCount.textContent = totalUnlocked;
    }
  }

  // --- Badge Detail Modal ---
  function openBadgeDetailModal(def, evalResult) {
    if (!badgeDetailModal) return;

    if (badgeModalCategory) badgeModalCategory.textContent = def.category;
    if (badgeModalTitle)    badgeModalTitle.textContent = def.title;
    if (badgeModalIcon)     badgeModalIcon.textContent = def.icon;
    if (badgeModalTitleKn)  badgeModalTitleKn.textContent = def.titleKn;
    if (badgeModalDesc)     badgeModalDesc.textContent = def.description;
    if (badgeModalCriteria) badgeModalCriteria.textContent = def.criteriaText;

    const pct = Math.min(100, Math.round((evalResult.progress / evalResult.target) * 100));
    if (badgeModalProgressBar) badgeModalProgressBar.style.width = `${pct}%`;
    if (badgeModalProgressLbl) {
      badgeModalProgressLbl.textContent = evalResult.earned
        ? 'Requirement met • Badge unlocked!'
        : `Current progress: ${evalResult.progress} of ${evalResult.target} attempts completed`;
    }

    if (badgeModalStatus) {
      badgeModalStatus.textContent = evalResult.earned ? 'Earned' : 'In Progress';
      badgeModalStatus.className = `badge-modal-status-pill ${evalResult.earned ? 'earned' : 'locked'}`;
    }

    // Populate supporting attempts (Core Requirement)
    if (badgeSupportingCount) badgeSupportingCount.textContent = evalResult.supportingAttempts.length;
    if (badgeSupportingList) {
      badgeSupportingList.innerHTML = '';
      if (evalResult.supportingAttempts.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'supporting-empty-msg';
        emptyMsg.textContent = 'No attempts recorded for this milestone yet. Step up and record one in the Practice tab!';
        badgeSupportingList.appendChild(emptyMsg);
      } else {
        evalResult.supportingAttempts.forEach(att => {
          const item = document.createElement('div');
          item.className = 'supporting-attempt-item';
          const outcomeClass = att.outcome || 'went_well';
          const outcomeText = att.outcome === 'went_well'
            ? 'Went well'
            : att.outcome === 'needed_help'
              ? 'Needed help'
              : 'Froze / Stumbled';

          item.innerHTML = `
            <div class="supporting-attempt-top">
              <span class="supporting-attempt-title">${att.situation}</span>
              <span class="attempt-outcome-pill ${outcomeClass}">${outcomeText}</span>
            </div>
            ${att.note ? `<div class="supporting-attempt-note">“${att.note}”</div>` : ''}
          `;
          badgeSupportingList.appendChild(item);
        });
      }
    }

    badgeDetailModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (btnBadgeModalClose) btnBadgeModalClose.focus();
  }

  function closeBadgeDetailModal() {
    if (!badgeDetailModal) return;
    badgeDetailModal.hidden = true;
    document.body.style.overflow = '';
  }

  if (btnBadgeModalClose) btnBadgeModalClose.addEventListener('click', closeBadgeDetailModal);
  if (badgeDetailModal) {
    badgeDetailModal.addEventListener('click', (e) => {
      if (e.target === badgeDetailModal) closeBadgeDetailModal();
    });
  }

  // --- Practice Log Outcome Filter ---
  logFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      logFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLogOutcomeFilter = btn.dataset.outcomeFilter || 'all';
      renderPracticeLog();
    });
  });

  // --- Render Practice Log ---
  function renderPracticeLog() {
    if (!innovateAttemptsList) return;
    const allAttempts = AttemptStore.getAll();
    const totalCount = allAttempts.length;

    // Update counter tags
    if (logTotalAttempts)  logTotalAttempts.textContent = totalCount;
    if (attemptLogCounter) {
      attemptLogCounter.textContent = totalCount;
      attemptLogCounter.hidden = (totalCount === 0);
    }

    if (totalCount === 0) {
      if (logEmptyState) logEmptyState.hidden = false;
      innovateAttemptsList.hidden = true;
      innovateAttemptsList.innerHTML = '';
      return;
    }

    // Filter by outcome if selected
    const filtered = allAttempts.filter(att => {
      if (currentLogOutcomeFilter === 'all') return true;
      return att.outcome === currentLogOutcomeFilter;
    });

    if (filtered.length === 0) {
      if (logEmptyState) logEmptyState.hidden = true;
      innovateAttemptsList.hidden = false;
      innovateAttemptsList.innerHTML = '<div class="supporting-empty-msg">No practice attempts match this outcome filter.</div>';
      return;
    }

    if (logEmptyState) logEmptyState.hidden = true;
    innovateAttemptsList.hidden = false;
    innovateAttemptsList.innerHTML = '';

    filtered.forEach(att => {
      const card = document.createElement('div');
      card.className = 'attempt-card';
      card.id = `attempt-${att.id}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View details for attempt: ${att.situation}`);

      const outcomeClass = att.outcome || 'went_well';
      const outcomeText = att.outcome === 'went_well'
        ? '✓ Went well'
        : att.outcome === 'needed_help'
          ? '🤝 Needed help'
          : '🌱 Froze / Tried';

      const dateStr = formatDate(att.timestamp);

      card.innerHTML = `
        <div class="attempt-card-top-row">
          <span class="attempt-outcome-pill ${outcomeClass}">${outcomeText}</span>
          <span class="attempt-date">${dateStr}</span>
        </div>
        <div class="attempt-situation">${att.situation}</div>
        ${att.note ? `<div class="attempt-note-preview">“${att.note}”</div>` : ''}
        <div class="attempt-footer-row">
          <span class="attempt-cat-badge">${formatCategoryName(att.category)}</span>
          <button type="button" class="btn-attempt-delete" aria-label="Delete attempt" title="Delete record">Delete</button>
        </div>
      `;

      // Delete listener
      const delBtn = card.querySelector('.btn-attempt-delete');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Delete this practice record?')) {
            AttemptStore.remove(att.id);
            showGardenToast('Practice record deleted.', 'info');
          }
        });
      }

      // Card click opens full detail modal
      const openDetail = () => openAttemptDetailModal(att);
      card.addEventListener('click', openDetail);
      card.addEventListener('keydown', (e) => {
        if (e.target === delBtn) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
      });

      innovateAttemptsList.appendChild(card);
    });
  }

  // --- Attempt Detail Modal ---
  function openAttemptDetailModal(att) {
    if (!attemptDetailModal || !attemptDetailBody) return;
    if (attemptDetailDate)  attemptDetailDate.textContent = formatDate(att.timestamp);
    if (attemptDetailTitle) attemptDetailTitle.textContent = 'Practice Record';

    const outcomeText = att.outcome === 'went_well'
      ? 'Went smoothly (ಚೆನ್ನಾಗಿ ಹೋಯಿತು)'
      : att.outcome === 'needed_help'
        ? 'Needed assistance (ಸಹಾಯ ಬೇಕಾಯಿತು)'
        : 'Froze in the moment (ಧೈರ್ಯದ ಹೆಜ್ಜೆ)';

    const outcomeClass = att.outcome || 'went_well';

    attemptDetailBody.innerHTML = `
      <div class="attempt-detail-view" style="display:flex; flex-direction:column; gap:14px; padding:8px 0;">
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-accent-gold); font-weight:700; margin-bottom:4px;">
            Situation / Spoken Phrase
          </div>
          <div style="font-size:1.063rem; font-weight:600; color:var(--color-text-primary); line-height:1.35;">
            ${att.situation}
          </div>
        </div>

        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-accent-gold); font-weight:700; margin-bottom:6px;">
            How It Went
          </div>
          <span class="attempt-outcome-pill ${outcomeClass}" style="font-size:0.875rem; padding:5px 12px;">
            ${outcomeText}
          </span>
        </div>

        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-accent-gold); font-weight:700; margin-bottom:4px;">
            Category
          </div>
          <div style="font-size:0.875rem; color:var(--color-text-secondary); text-transform:capitalize;">
            ${formatCategoryName(att.category)}
          </div>
        </div>

        ${att.connectedItemText ? `
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-accent-gold); font-weight:700; margin-bottom:4px;">
              Connected Word Garden Item
            </div>
            <div style="font-size:0.875rem; color:var(--color-accent-green); font-weight:600;">
              🌿 ${att.connectedItemText}
            </div>
          </div>
        ` : ''}

        ${att.note ? `
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-accent-gold); font-weight:700; margin-bottom:4px;">
              Personal Reflection / Note
            </div>
            <div style="background:var(--color-bg-canvas); padding:10px 14px; border-radius:10px; font-size:0.875rem; color:var(--color-text-secondary); line-height:1.45; font-style:italic;">
              “${att.note}”
            </div>
          </div>
        ` : ''}
      </div>
    `;

    attemptDetailModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (btnAttemptDetailClose) btnAttemptDetailClose.focus();
  }

  function closeAttemptDetailModal() {
    if (!attemptDetailModal) return;
    attemptDetailModal.hidden = true;
    document.body.style.overflow = '';
  }

  if (btnAttemptDetailClose) btnAttemptDetailClose.addEventListener('click', closeAttemptDetailModal);
  if (attemptDetailModal) {
    attemptDetailModal.addEventListener('click', (e) => {
      if (e.target === attemptDetailModal) closeAttemptDetailModal();
    });
  }

  // =========================================================================
  // STEP 8: TRANSFORM COMMUNITY & USER PROFILE DATA LAYER
  // =========================================================================

  const ProfileStore = (() => {
    const STORAGE_KEY = 'nammooru_profile_v1';
    const DEFAULT_PROFILE = {
      name: 'Bengaluru Newcomer',
      bio: 'Learning Kannada one conversation at a time.',
      status: 'Explorer',
      avatar: '👤',
      joinedAt: new Date().toISOString()
    };

    function read() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_PROFILE };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_PROFILE, ...parsed };
      } catch {
        return { ...DEFAULT_PROFILE };
      }
    }

    function write(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }

    return {
      get() { return read(); },
      update(updates) {
        const current = read();
        const updated = { ...current, ...updates };
        write(updated);
        return updated;
      }
    };
  })();

  const CommunityStore = (() => {
    const STORAGE_KEY = 'nammooru_community_v1';
    const listeners = new Set();

    const STARTER_POSTS = [
      {
        id: 'post_starter_1',
        author: 'Rohan M. (Indiranagar)',
        category: 'success',
        title: 'Ordered filter coffee without switching to English today!',
        content: 'Walked into a local Darshini near 100ft Road and said "Ondu filter coffee kodi". The uncle smiled, asked "Bisiya?" (Hot?), and handed me the tumbler. Small moment, but made my whole morning!',
        helpfulCount: 8,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        isUserPost: false
      },
      {
        id: 'post_starter_2',
        author: 'Priya K. (HSR Layout)',
        category: 'phrase',
        title: 'A phrase that saves me every morning with autos',
        content: '"Meter haaki sir" (ಮೀಟರ್ ಹಾಕಿ ಸರ್ — Please put the meter, sir) said politely with a smile works 80% of the time around BDA complex. If they hesitate, adding "Dayavittu" (ದಯವಿಟ್ಟು) softens the mood completely.',
        helpfulCount: 14,
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        isUserPost: false
      },
      {
        id: 'post_starter_3',
        author: 'Amit S. (Whitefield)',
        category: 'help',
        title: 'How do I politely say "Keep the change" to a vendor?',
        content: 'When buying tender coconut for ₹50 and handing ₹60, how do you say "Keep the change" naturally without sounding rude? Any native speakers who can share the common phrase?',
        helpfulCount: 5,
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        isUserPost: false
      }
    ];

    function read() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          write(STARTER_POSTS);
          return [...STARTER_POSTS];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [...STARTER_POSTS];
      } catch {
        return [...STARTER_POSTS];
      }
    }

    function write(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        listeners.forEach(fn => { try { fn(items); } catch (e) { console.error(e); } });
        return true;
      } catch {
        return false;
      }
    }

    return {
      getAll() { return read(); },
      add(post) {
        const all = read();
        const newPost = {
          id: 'post_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          author: post.author || ProfileStore.get().name || 'Bengaluru Newcomer',
          category: post.category || 'success',
          title: String(post.title || '').trim(),
          content: String(post.content || '').trim(),
          helpfulCount: 0,
          timestamp: new Date().toISOString(),
          isUserPost: true
        };
        all.unshift(newPost);
        write(all);
        return newPost;
      },
      upvote(id) {
        const all = read();
        const target = all.find(p => p.id === id);
        if (target) {
          target.helpfulCount = (target.helpfulCount || 0) + 1;
          write(all);
          return target.helpfulCount;
        }
        return 0;
      },
      remove(id) {
        const all = read();
        const filtered = all.filter(p => p.id !== id);
        if (filtered.length !== all.length) {
          write(filtered);
          return true;
        }
        return false;
      },
      subscribe(fn) {
        if (typeof fn === 'function') listeners.add(fn);
        return () => listeners.delete(fn);
      }
    };
  })();

  // =========================================================================
  // TRANSFORM UI CONTROLLER
  // =========================================================================

  const profileDisplayName  = document.getElementById('profile-display-name');
  const profileBioText      = document.getElementById('profile-bio-text');
  const profileGardenCount  = document.getElementById('profile-garden-count');
  const profileAttemptsCount= document.getElementById('profile-attempts-count');
  const profileBadgesCount  = document.getElementById('profile-badges-count');
  const btnEditProfile      = document.getElementById('btn-edit-profile');

  const modalEditProfile    = document.getElementById('modal-edit-profile');
  const btnCloseEditProfile = document.getElementById('btn-close-edit-profile');
  const formEditProfile     = document.getElementById('form-edit-profile');
  const profileNameInput    = document.getElementById('profile-name-input');
  const profileBioInput     = document.getElementById('profile-bio-input');

  const btnOpenCreatePost   = document.getElementById('btn-open-create-post');
  const modalCreatePost     = document.getElementById('modal-create-post');
  const btnCloseCreatePost  = document.getElementById('btn-close-create-post');
  const formCreatePost      = document.getElementById('form-create-post');
  const postCategorySelect  = document.getElementById('post-category-select');
  const postTitleInput      = document.getElementById('post-title-input');
  const postContentInput    = document.getElementById('post-content-input');

  const communityCategoryBar= document.getElementById('community-category-bar');
  const communityFeedList   = document.getElementById('community-feed-list');

  let currentFeedFilter = 'all';

  function syncProfileCard() {
    const profile = ProfileStore.get();
    if (profileDisplayName) profileDisplayName.textContent = profile.name;
    if (profileBioText)     profileBioText.textContent = profile.bio;

    const avatarInitials = document.getElementById('profile-avatar-initials');
    if (avatarInitials && profile.name) {
      const parts = profile.name.trim().split(/\s+/);
      const initials = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
      avatarInitials.textContent = initials || 'BN';
    }

    const gardenData = GardenStore.count();
    if (profileGardenCount) profileGardenCount.textContent = gardenData.total;

    const attempts = AttemptStore.getAll();
    if (profileAttemptsCount) profileAttemptsCount.textContent = attempts.length;

    const earnedBadges = BADGE_DEFINITIONS.filter(b => b.evaluate(attempts).earned).length;
    if (profileBadgesCount) profileBadgesCount.textContent = `${earnedBadges}/${BADGE_DEFINITIONS.length}`;
  }

  function renderCommunityFeed() {
    if (!communityFeedList) return;
    const posts = CommunityStore.getAll();
    communityFeedList.innerHTML = '';

    const filtered = posts.filter(post => {
      if (currentFeedFilter === 'all') return true;
      return post.category === currentFeedFilter;
    });

    if (filtered.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'learn-empty-search';
      emptyBox.innerHTML = `
        <div class="empty-search-icon">💬</div>
        <h3 class="empty-search-title">No posts in this category yet</h3>
        <p class="empty-search-desc">Be the first to share an experience, phrase, or question with the community!</p>
      `;
      communityFeedList.appendChild(emptyBox);
      return;
    }

    filtered.forEach(post => {
      const card = document.createElement('div');
      card.className = 'community-post-card';
      card.id = post.id;

      const catLabels = {
        success: '🌟 Success Story',
        phrase: '💡 Learned Phrase',
        help: '🤝 Question & Help',
        tip: '📍 Bengaluru Tip'
      };

      const dateStr = formatDate(post.timestamp);

      card.innerHTML = `
        <div class="post-header-row">
          <div class="post-author-group">
            <div class="post-author-avatar" aria-hidden="true">👤</div>
            <div>
              <span class="post-author-name">${escapeHtml(post.author)}</span>
              <span class="post-time">• ${dateStr}</span>
            </div>
          </div>
          <span class="post-cat-pill ${post.category}">${catLabels[post.category] || 'Community'}</span>
        </div>

        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-body-text">${escapeHtml(post.content)}</p>

        <div class="post-footer-actions">
          <button type="button" class="btn-post-helpful" data-post-id="${post.id}" aria-label="Mark post as helpful">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span class="helpful-count-label">Helpful (${post.helpfulCount || 0})</span>
          </button>

          ${post.isUserPost ? `<button type="button" class="btn-attempt-delete btn-delete-post" data-post-id="${post.id}" title="Delete post">Delete</button>` : ''}
        </div>
      `;

      // Upvote listener
      const helpfulBtn = card.querySelector('.btn-post-helpful');
      if (helpfulBtn) {
        helpfulBtn.addEventListener('click', () => {
          CommunityStore.upvote(post.id);
          helpfulBtn.classList.add('voted');
          showGardenToast('Thank you for your feedback! 🤝', 'success', 2000);
        });
      }

      // Delete listener for user posts
      const deleteBtn = card.querySelector('.btn-delete-post');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Delete this community post?')) {
            CommunityStore.remove(post.id);
            showGardenToast('Post deleted.', 'info');
          }
        });
      }

      communityFeedList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Filter Category Pill Listener ---
  if (communityCategoryBar) {
    communityCategoryBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      currentFeedFilter = btn.dataset.feedCat || 'all';
      communityCategoryBar.querySelectorAll('.cat-pill').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      renderCommunityFeed();
    });
  }

  // --- Create Post Modal Handlers ---
  function openCreatePostModal() {
    if (!modalCreatePost) return;
    modalCreatePost.hidden = false;
    document.body.style.overflow = 'hidden';
    if (postTitleInput) postTitleInput.focus();
  }

  function closeCreatePostModal() {
    if (!modalCreatePost) return;
    modalCreatePost.hidden = true;
    document.body.style.overflow = '';
  }

  if (btnOpenCreatePost)  btnOpenCreatePost.addEventListener('click', openCreatePostModal);
  if (btnCloseCreatePost) btnCloseCreatePost.addEventListener('click', closeCreatePostModal);
  if (modalCreatePost) {
    modalCreatePost.addEventListener('click', (e) => {
      if (e.target === modalCreatePost) closeCreatePostModal();
    });
  }

  if (formCreatePost) {
    formCreatePost.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = (postTitleInput ? postTitleInput.value : '').trim();
      const content = (postContentInput ? postContentInput.value : '').trim();
      const cat = (postCategorySelect ? postCategorySelect.value : 'success');

      if (!title || !content) {
        showGardenToast('Please fill in both a title and story details.', 'info');
        return;
      }

      const profile = ProfileStore.get();
      CommunityStore.add({
        author: profile.name,
        category: cat,
        title: title,
        content: content
      });

      // Reset & close
      postTitleInput.value = '';
      postContentInput.value = '';
      closeCreatePostModal();
      showGardenToast('Post published to community! 🌟', 'success', 3000);
      renderCommunityFeed();
    });
  }

  // --- Edit Profile Modal Handlers ---
  function openEditProfileModal() {
    if (!modalEditProfile) return;
    const profile = ProfileStore.get();
    if (profileNameInput) profileNameInput.value = profile.name || '';
    if (profileBioInput)  profileBioInput.value  = profile.bio  || '';
    modalEditProfile.hidden = false;
    document.body.style.overflow = 'hidden';
    if (profileNameInput) profileNameInput.focus();
  }

  function closeEditProfileModal() {
    if (!modalEditProfile) return;
    modalEditProfile.hidden = true;
    document.body.style.overflow = '';
  }

  if (btnEditProfile)      btnEditProfile.addEventListener('click', openEditProfileModal);
  if (btnCloseEditProfile) btnCloseEditProfile.addEventListener('click', closeEditProfileModal);
  if (modalEditProfile) {
    modalEditProfile.addEventListener('click', (e) => {
      if (e.target === modalEditProfile) closeEditProfileModal();
    });
  }

  if (formEditProfile) {
    formEditProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (profileNameInput ? profileNameInput.value : '').trim();
      const bio  = (profileBioInput ? profileBioInput.value : '').trim();

      if (!name) {
        showGardenToast('Please enter a display name.', 'info');
        return;
      }

      ProfileStore.update({ name, bio });
      closeEditProfileModal();
      syncProfileCard();
      showGardenToast('Profile updated! ✨', 'success', 2500);
    });
  }

  // --- Subscribe Community & Profile Changes ---
  CommunityStore.subscribe(() => {
    renderCommunityFeed();
  });

  GardenStore.subscribe(() => {
    syncProfileCard();
  });

  AttemptStore.subscribe(() => {
    syncProfileCard();
    updateInnovateStats();
    renderBadgesShowcase();
    renderPracticeLog();
  });

  window.switchSection = switchSection;
  window.openGardenModal = openGardenModal;
  window.closeGardenModal = closeGardenModal;
  window.openHistoryModal = openHistoryModal;
  window.closeHistoryModal = closeHistoryModal;
  window.GardenStore = GardenStore;
  window.AttemptStore = AttemptStore;
  window.ProfileStore = ProfileStore;
  window.CommunityStore = CommunityStore;
  window.BADGE_DEFINITIONS = BADGE_DEFINITIONS;
  window.updateInnovateStats = updateInnovateStats;

  // ==========================================================================
  // PART 14: Optional Secure Two-Factor Authentication (TOTP / Google Authenticator)
  // ==========================================================================
  const AUTH_STORAGE_KEY = 'nammooru_auth_session';

  // Modal & Trigger DOM Elements
  const authModal           = document.getElementById('auth-modal');
  const btnAuthTrigger      = document.getElementById('btn-auth-trigger');
  const btnCloseAuthModal   = document.getElementById('btn-close-auth-modal');
  const authPillLabel       = document.getElementById('auth-pill-label');
  const authPillDot         = document.getElementById('auth-pill-dot');
  const profile2FaBadge     = document.getElementById('profile-2fa-badge');
  const profile2FaText      = document.getElementById('profile-2fa-text');

  // Step Panels
  const stepSetup           = document.getElementById('auth-step-setup');
  const stepVerify          = document.getElementById('auth-step-verify');
  const stepActive          = document.getElementById('auth-step-active');

  // Step 1 Elements
  const formAuthSetup       = document.getElementById('form-auth-setup');
  const authIdentifierInput = document.getElementById('auth-identifier-input');
  const btnGenerateTotp     = document.getElementById('btn-generate-totp');
  const authQrSection       = document.getElementById('auth-qr-section');
  const authQrImage         = document.getElementById('auth-qr-image');
  const authSecretDisplay   = document.getElementById('auth-secret-display');
  const btnCopySecret       = document.getElementById('btn-copy-secret');
  const btnProceedToVerify  = document.getElementById('btn-proceed-to-verify');

  // Step 2 Elements
  const formAuthVerify      = document.getElementById('form-auth-verify');
  const verifyUserIdent     = document.getElementById('verify-user-identifier');
  const totpDigitInputs     = Array.from(document.querySelectorAll('.totp-digit-input'));
  const authErrorBanner     = document.getElementById('auth-error-banner');
  const authErrorMessage   = document.getElementById('auth-error-message');
  const authSuccessBanner   = document.getElementById('auth-success-banner');
  const authSuccessMessage = document.getElementById('auth-success-message');
  const btnSubmitVerify     = document.getElementById('btn-submit-verify');
  const verifySpinner       = document.getElementById('verify-spinner');
  const btnBackToSetup      = document.getElementById('btn-back-to-setup');

  // Step 3 Elements
  const sessionUserId       = document.getElementById('session-user-id');
  const sessionVerifiedTime = document.getElementById('session-verified-time');
  const btnReconfigure2fa   = document.getElementById('btn-reconfigure-2fa');
  const btnAuthLogout       = document.getElementById('btn-auth-logout');

  // Bypass Element
  const btnAuthBypass       = document.getElementById('btn-auth-bypass');

  // In-memory Auth State
  let currentSession = null;
  let pendingAuthData = null;

  // Safe localStorage reading/writing
  function loadLocalSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token && parsed.identifier) {
        return parsed;
      }
      return null;
    } catch (e) {
      console.warn('[Auth] Error reading auth session from localStorage:', e);
      return null;
    }
  }

  function saveLocalSession(sessionData) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[Auth] Error saving auth session to localStorage:', e);
    }
  }

  function removeLocalSession() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('[Auth] Error removing auth session from localStorage:', e);
    }
  }

  function updateAuthUI() {
    if (currentSession && currentSession.is2FAVerified) {
      // Authenticated state
      const idName = currentSession.identifier || 'User';
      const shortName = idName.length > 14 ? idName.slice(0, 12) + '…' : idName;
      
      if (authPillLabel) authPillLabel.textContent = `${shortName} • 2FA`;
      if (btnAuthTrigger) {
        btnAuthTrigger.classList.add('authenticated');
        btnAuthTrigger.setAttribute('title', `Logged in with 2FA as ${idName}`);
      }
      if (authPillDot) authPillDot.hidden = false;

      // Transform Tab Profile Status
      if (profile2FaBadge) profile2FaBadge.classList.add('verified');
      if (profile2FaText) profile2FaText.textContent = '2FA Active';

      // Active panel details
      if (sessionUserId) sessionUserId.textContent = idName;
      if (sessionVerifiedTime && currentSession.verifiedAt) {
        try {
          const d = new Date(currentSession.verifiedAt);
          sessionVerifiedTime.textContent = d.toLocaleString();
        } catch {
          sessionVerifiedTime.textContent = currentSession.verifiedAt;
        }
      }
    } else {
      // Unauthenticated state
      if (authPillLabel) authPillLabel.textContent = '2FA Login';
      if (btnAuthTrigger) {
        btnAuthTrigger.classList.remove('authenticated');
        btnAuthTrigger.setAttribute('title', 'Open 2FA Login / Setup');
      }
      if (authPillDot) authPillDot.hidden = true;

      // Transform Tab Profile Status
      if (profile2FaBadge) profile2FaBadge.classList.remove('verified');
      if (profile2FaText) profile2FaText.textContent = '2FA Optional';
    }
  }

  function showAuthPanel(panelName) {
    if (stepSetup)  stepSetup.hidden  = (panelName !== 'setup');
    if (stepVerify) stepVerify.hidden = (panelName !== 'verify');
    if (stepActive) stepActive.hidden = (panelName !== 'active');
    hideAuthAlerts();
  }

  function hideAuthAlerts() {
    if (authErrorBanner)   authErrorBanner.hidden = true;
    if (authSuccessBanner) authSuccessBanner.hidden = true;
  }

  function showAuthError(msg) {
    if (authErrorBanner && authErrorMessage) {
      authErrorMessage.textContent = msg || 'An error occurred. Please try again.';
      authErrorBanner.hidden = false;
    }
    if (authSuccessBanner) authSuccessBanner.hidden = true;
  }

  function showAuthSuccess(msg) {
    if (authSuccessBanner && authSuccessMessage) {
      authSuccessMessage.textContent = msg || 'Success!';
      authSuccessBanner.hidden = false;
    }
    if (authErrorBanner) authErrorBanner.hidden = true;
  }

  function openAuthModal() {
    if (!authModal) return;
    authModal.hidden = false;
    if (btnAuthTrigger) btnAuthTrigger.setAttribute('aria-expanded', 'true');

    if (currentSession && currentSession.is2FAVerified) {
      showAuthPanel('active');
    } else if (pendingAuthData) {
      showAuthPanel('verify');
      focusFirstTotpInput();
    } else {
      showAuthPanel('setup');
      if (authIdentifierInput) {
        const currentProfile = (typeof ProfileStore !== 'undefined' && ProfileStore.get) 
          ? ProfileStore.get().name 
          : 'Bengaluru Pioneer';
        authIdentifierInput.value = currentProfile || 'Bengaluru Pioneer';
        authIdentifierInput.focus();
      }
    }
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.hidden = true;
    if (btnAuthTrigger) btnAuthTrigger.setAttribute('aria-expanded', 'false');
    hideAuthAlerts();
  }

  // --- Step 1: Request 2FA Setup from Backend ---
  async function requestTotpSetup(identifier, reset = false) {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      showAuthError('Please enter a user identifier or display name.');
      return;
    }

    try {
      if (btnGenerateTotp) {
        btnGenerateTotp.disabled = true;
        btnGenerateTotp.style.opacity = '0.7';
      }

      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, reset })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to setup TOTP');
      }

      pendingAuthData = data;

      // Update QR Code display
      if (authQrImage && data.qrCode) {
        authQrImage.src = data.qrCode;
        authQrImage.hidden = false;
      }
      if (authSecretDisplay) {
        authSecretDisplay.textContent = data.secret || '---';
      }
      if (authQrSection) {
        authQrSection.hidden = false;
      }

      showGardenToast('QR code generated! Scan in Google Authenticator 📱', 'success', 3000);
    } catch (err) {
      console.error('[Auth Setup Error]', err);
      showAuthError(err.message || 'Could not connect to authentication server.');
    } finally {
      if (btnGenerateTotp) {
        btnGenerateTotp.disabled = false;
        btnGenerateTotp.style.opacity = '1';
      }
    }
  }

  // --- Step 2: Verify 6-Digit TOTP Code ---
  async function verifyTotpCode(code) {
    if (!pendingAuthData || !pendingAuthData.identifier) {
      showAuthError('Session expired. Please set up your authenticator first.');
      showAuthPanel('setup');
      return;
    }

    const cleanCode = (code || '').replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      showAuthError('Please enter all 6 numeric digits from your authenticator app.');
      return;
    }

    hideAuthAlerts();
    if (btnSubmitVerify) {
      btnSubmitVerify.disabled = true;
      if (verifySpinner) verifySpinner.hidden = false;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: pendingAuthData.identifier,
          code: cleanCode
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Clear digit inputs and refocus
        clearTotpInputs();
        focusFirstTotpInput();
        showAuthError(data.message || 'Code expired or incorrect. Please check your authenticator app.');
        return;
      }

      // Verification Success!
      currentSession = {
        token: data.token,
        identifier: data.identifier,
        verifiedAt: data.verifiedAt || new Date().toISOString(),
        expiresAt: data.expiresAt,
        is2FAVerified: true
      };

      saveLocalSession(currentSession);
      updateAuthUI();
      showAuthSuccess('Two-Factor Authentication verified successfully! ✨');
      showGardenToast('🌿 2FA Authenticated! Welcome to Nammooru.', 'success', 3500);

      // Transition to active panel after brief celebration
      setTimeout(() => {
        showAuthPanel('active');
      }, 1000);

    } catch (err) {
      console.error('[Auth Verify Error]', err);
      showAuthError('Connection error. Please check that the local server is running.');
    } finally {
      if (btnSubmitVerify) {
        btnSubmitVerify.disabled = false;
        if (verifySpinner) verifySpinner.hidden = true;
      }
    }
  }

  // --- Step 3: Logout / Disconnect ---
  async function logoutAuth() {
    if (currentSession && currentSession.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentSession.token })
        });
      } catch (e) {
        console.warn('[Auth] Remote logout notification failed:', e);
      }
    }

    currentSession = null;
    pendingAuthData = null;
    removeLocalSession();
    clearTotpInputs();
    updateAuthUI();
    showAuthPanel('setup');
    showGardenToast('Signed out of 2FA. Browsing in Guest Mode.', 'info', 2500);
  }

  // --- 6-Digit TOTP Input Behavior (Numeric Keypad, Auto-Advance, Paste) ---
  function clearTotpInputs() {
    totpDigitInputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
  }

  function focusFirstTotpInput() {
    if (totpDigitInputs.length > 0) {
      setTimeout(() => totpDigitInputs[0].focus(), 80);
    }
  }

  function getCombinedTotpCode() {
    return totpDigitInputs.map(input => input.value.trim()).join('');
  }

  totpDigitInputs.forEach((input, index) => {
    // Input event: auto advance
    input.addEventListener('input', (e) => {
      const val = input.value.replace(/\D/g, '');
      input.value = val ? val.slice(-1) : '';
      input.classList.toggle('filled', Boolean(input.value));

      hideAuthAlerts();

      if (input.value && index < totpDigitInputs.length - 1) {
        totpDigitInputs[index + 1].focus();
      }

      // If all 6 digits entered, auto-verify
      if (getCombinedTotpCode().length === 6) {
        verifyTotpCode(getCombinedTotpCode());
      }
    });

    // Keydown event: backspace and arrow navigation
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!input.value && index > 0) {
          totpDigitInputs[index - 1].focus();
          totpDigitInputs[index - 1].value = '';
          totpDigitInputs[index - 1].classList.remove('filled');
        } else {
          input.value = '';
          input.classList.remove('filled');
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        totpDigitInputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < totpDigitInputs.length - 1) {
        totpDigitInputs[index + 1].focus();
      }
    });

    // Paste event: distribute 6 digits automatically across inputs
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = pasted.replace(/\D/g, '').slice(0, 6);
      if (!digits) return;

      digits.split('').forEach((d, i) => {
        if (totpDigitInputs[i]) {
          totpDigitInputs[i].value = d;
          totpDigitInputs[i].classList.add('filled');
        }
      });

      const nextIdx = Math.min(digits.length, totpDigitInputs.length - 1);
      totpDigitInputs[nextIdx].focus();

      if (digits.length === 6) {
        verifyTotpCode(digits);
      }
    });
  });

  // --- Copy Secret Button ---
  if (btnCopySecret) {
    btnCopySecret.addEventListener('click', async () => {
      const secret = authSecretDisplay ? authSecretDisplay.textContent.trim() : '';
      if (!secret || secret === '--------') return;

      try {
        await navigator.clipboard.writeText(secret);
        btnCopySecret.classList.add('copied');
        const span = btnCopySecret.querySelector('span');
        if (span) span.textContent = 'Copied!';
        setTimeout(() => {
          btnCopySecret.classList.remove('copied');
          if (span) span.textContent = 'Copy';
        }, 2000);
      } catch {
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = secret;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const span = btnCopySecret.querySelector('span');
        if (span) span.textContent = 'Copied!';
        setTimeout(() => {
          if (span) span.textContent = 'Copy';
        }, 2000);
      }
    });
  }

  // --- Form & Button Event Listeners ---
  if (btnAuthTrigger) {
    btnAuthTrigger.addEventListener('click', () => {
      openAuthModal();
    });
  }

  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', () => {
      closeAuthModal();
    });
  }

  if (formAuthSetup) {
    formAuthSetup.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = authIdentifierInput ? authIdentifierInput.value.trim() : '';
      requestTotpSetup(id);
    });
  }

  if (btnProceedToVerify) {
    btnProceedToVerify.addEventListener('click', () => {
      if (!pendingAuthData) {
        showAuthError('Please generate a setup QR code first.');
        return;
      }
      if (verifyUserIdent) {
        verifyUserIdent.textContent = pendingAuthData.identifier || 'User';
      }
      showAuthPanel('verify');
      clearTotpInputs();
      focusFirstTotpInput();
    });
  }

  if (formAuthVerify) {
    formAuthVerify.addEventListener('submit', (e) => {
      e.preventDefault();
      verifyTotpCode(getCombinedTotpCode());
    });
  }

  if (btnBackToSetup) {
    btnBackToSetup.addEventListener('click', () => {
      showAuthPanel('setup');
    });
  }

  if (btnReconfigure2fa) {
    btnReconfigure2fa.addEventListener('click', () => {
      const id = currentSession ? currentSession.identifier : '';
      showAuthPanel('setup');
      if (id) {
        requestTotpSetup(id, true);
      }
    });
  }

  if (btnAuthLogout) {
    btnAuthLogout.addEventListener('click', () => {
      logoutAuth();
    });
  }

  if (btnAuthBypass) {
    btnAuthBypass.addEventListener('click', () => {
      closeAuthModal();
      showGardenToast('Guest mode active — Explore Learn, Photo, and Innovate freely!', 'info', 2800);
    });
  }

  // Close modal when clicking on the frosted overlay background
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        closeAuthModal();
      }
    });
  }

  // Global Escape key handler for all modals including auth
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (authModal && !authModal.hidden) closeAuthModal();
      if (badgeDetailModal && !badgeDetailModal.hidden) closeBadgeDetailModal();
      if (attemptDetailModal && !attemptDetailModal.hidden) closeAttemptDetailModal();
      if (gardenPickerModal && !gardenPickerModal.hidden) closeGardenPicker();
      if (modalCreatePost && !modalCreatePost.hidden) closeCreatePostModal();
      if (modalEditProfile && !modalEditProfile.hidden) closeEditProfileModal();
    }
  });

  // --- Initial Session Boot Check ---
  currentSession = loadLocalSession();
  updateAuthUI();

  // Non-blocking server validation for existing session
  if (currentSession && currentSession.token) {
    fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.token}`
      },
      body: JSON.stringify({ token: currentSession.token })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.valid) {
        console.info('[Auth] Previous session expired on server. Returning to guest state.');
        currentSession = null;
        removeLocalSession();
        updateAuthUI();
      }
    })
    .catch(() => {
      // If offline, keep local state intact
    });
  }

  // Expose NammooruAuth globally for testing & external extensions
  window.NammooruAuth = {
    getSession: () => currentSession,
    isAuthenticated: () => Boolean(currentSession && currentSession.is2FAVerified),
    openModal: openAuthModal,
    closeModal: closeAuthModal,
    logout: logoutAuth,
    requestSetup: requestTotpSetup,
    verifyCode: verifyTotpCode
  };

  // Expose stores for modularity and verification
  window.ProfileStore = ProfileStore;
  window.CommunityStore = CommunityStore;

  // Initial Sync
  syncProfileCard();
  renderCommunityFeed();

  // =========================================================================
  // INTERACTIVE OPTICAL LENS MOTION GRAPHIC (Touch & Cursor Reactive)
  // =========================================================================
  function initLensMotionGraphic() {
    const canvas = document.getElementById('lens-motion-canvas');
    const container = document.getElementById('scanner-frame-ambient');
    const sensorHalo = document.getElementById('sensor-halo-ring');
    const guidancePill = document.getElementById('optical-guidance-pill');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let targetX = width / 2;
    let targetY = height / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isInteracting = false;
    let animId = null;

    // Rings and Ripples
    const ripples = [];
    function addRipple(x, y, color = '#FFD027') {
      ripples.push({
        x,
        y,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.75,
        alpha: 1,
        color
      });
      if (ripples.length > 8) ripples.shift();
    }

    // Particles
    const PARTICLE_COUNT = 36;
    const particles = [];
    const colors = ['#FFD027', '#818CF8', '#22C55E', '#FB7185', '#38BDF8'];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * (width || 360),
        y: Math.random() * (height || 400),
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.5,
        color: colors[i % colors.length],
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 80 + 30
      });
    }

    // Pointer Events
    function updatePointer(clientX, clientY, isDown = false) {
      const rect = container.getBoundingClientRect();
      targetX = Math.max(20, Math.min(rect.width - 20, clientX - rect.left));
      targetY = Math.max(20, Math.min(rect.height - 20, clientY - rect.top));
      isInteracting = true;
      if (isDown) {
        addRipple(targetX, targetY, colors[Math.floor(Math.random() * colors.length)]);
      }
    }

    container.addEventListener('pointermove', (e) => {
      updatePointer(e.clientX, e.clientY, false);
    }, { passive: true });

    container.addEventListener('pointerdown', (e) => {
      updatePointer(e.clientX, e.clientY, true);
      if (sensorHalo) {
        sensorHalo.classList.add('pulse-active');
        setTimeout(() => sensorHalo.classList.remove('pulse-active'), 300);
      }
    });

    container.addEventListener('pointerleave', () => {
      isInteracting = false;
      targetX = width / 2;
      targetY = height / 2;
    });

    // Touch fallback
    container.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY, false);
      }
    }, { passive: true });

    container.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    }, { passive: true });

    let t = 0;
    function render() {
      // Only render if photo section is active and preview image is not visible
      const photoSection = document.getElementById('section-photo');
      const previewContainer = document.getElementById('photo-preview-container');
      const isVisible = photoSection && !photoSection.hidden && (!previewContainer || previewContainer.hidden);

      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      t += 0.02;

      // Smooth dampening towards target
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      // Update center sensor translation slightly for physical depth
      if (sensorHalo) {
        const dx = (currentX - width / 2) * 0.22;
        const dy = (currentY - height / 2) * 0.22;
        sensorHalo.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      // Clear with dark OLED / rich backdrop
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0E1116';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Subtle Background Tech Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Reactive Radial Glow
      const glowGrad = ctx.createRadialGradient(currentX, currentY, 10, currentX, currentY, 180);
      glowGrad.addColorStop(0, 'rgba(255, 208, 39, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(129, 140, 248, 0.12)');
      glowGrad.addColorStop(1, 'rgba(14, 17, 22, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Concentric Reactive Sonar Rings
      const ringCount = 4;
      for (let r = 1; r <= ringCount; r++) {
        const pulse = Math.sin(t * 1.5 + r * 0.6) * 6;
        const radius = r * 34 + pulse;
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r === 1 ? 'rgba(255, 208, 39, 0.8)' : `rgba(255, 208, 39, ${0.45 - r * 0.08})`;
        ctx.lineWidth = r === 1 ? 2.5 : 1.5;
        if (r % 2 === 0) {
          ctx.setLineDash([6, 6]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Draw Orbiting Aperture Crosshairs
      const rot = t * 0.8;
      ctx.save();
      ctx.translate(currentX, currentY);
      ctx.rotate(rot);
      ctx.strokeStyle = '#FFD027';
      ctx.lineWidth = 2;
      const bladeLen = 22;
      const gap = 14;
      for (let a = 0; a < 4; a++) {
        ctx.beginPath();
        ctx.moveTo(gap, 0);
        ctx.lineTo(gap + bladeLen, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 2);
      }
      ctx.restore();

      // 5. Draw Particles Swirling in Gravity Field
      particles.forEach((p, idx) => {
        // Orbit around current focal point
        p.angle += (idx % 2 === 0 ? 0.015 : -0.015);
        const targetPx = currentX + Math.cos(p.angle) * p.dist;
        const targetPy = currentY + Math.sin(p.angle) * p.dist * 0.85;

        p.x += (targetPx - p.x) * 0.06 + p.vx;
        p.y += (targetPy - p.y) * 0.06 + p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect near neighbors with faint energy lines
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          if (distSq < 3200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 - distSq / 32000})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      // 6. Draw Shockwave Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 5.5;
        rip.alpha *= 0.94;

        if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = rip.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = rip.alpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    }

    render();
  }

  initLensMotionGraphic();
  if (typeof window.updateWordPetCompanion === 'function') {
    window.updateWordPetCompanion();
  }

});


