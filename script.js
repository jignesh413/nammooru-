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

  // Valid section identifiers for the project shell
  const VALID_SECTIONS = ['photo', 'learn', 'innovate', 'transform'];
  const DEFAULT_SECTION = 'photo';

  /**
   * Activates the requested section and updates navigation state.
   * 
   * @param {string} sectionId - The target section name ('photo', 'learn', 'innovate', 'transform')
   * @param {boolean} shouldUpdateHash - Whether to sync window.location.hash
   */
  function switchSection(sectionId, shouldUpdateHash = true) {
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
  const btnUploadGallery = document.getElementById('btn-upload-gallery');
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

  // Configuration Constants
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes
  const ALLOWED_MIME_PREFIX = 'image/';
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'];

  // State Tracking
  let currentObjectUrl = null;
  let lastTriggerSource = 'camera'; // 'camera' or 'gallery'
  let feedbackTimeoutId = null;
  let activeFile = null;

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
   * Validates size, formats preview, and updates interface state.
   * 
   * @param {File} file - Selected file object
   */
  function handleFileSelection(file) {
    if (!file) {
      // User cancelled picker without selecting
      if (!currentObjectUrl) {
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

    // 4. Generate new object URL for preview
    try {
      currentObjectUrl = URL.createObjectURL(file);
      previewImage.src = currentObjectUrl;

      // Update metadata bar
      const sizeFormatted = formatFileSize(file.size);
      previewFilename.textContent = `${file.name || 'Photo'} (${sizeFormatted})`;

      // Track active file for Step 3 object recognition
      activeFile = file;

      // 5. Update UI Viewport States
      previewContainer.hidden = false;
      captureActions.hidden = true;

      const btnIdentifyEl = document.getElementById('btn-identify');
      if (btnIdentifyEl) btnIdentifyEl.hidden = false;

      // Subtly hide ambient city visual to focus on user's photo
      if (heroAmbientVisual) {
        heroAmbientVisual.hidden = true;
      }

      showFeedback('Photo ready! You can retake or remove it below.', 'success', 3500);
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

    previewImage.removeAttribute('src');
    previewFilename.textContent = '';
    cameraInput.value = '';
    galleryInput.value = '';

    previewContainer.hidden = true;
    captureActions.hidden = false;

    activeFile = null;
    const btnIdentifyEl = document.getElementById('btn-identify');
    if (btnIdentifyEl) btnIdentifyEl.hidden = true;
    const resultPanelEl = document.getElementById('result-panel');
    if (resultPanelEl) resultPanelEl.hidden = true;

    if (heroAmbientVisual) {
      heroAmbientVisual.hidden = false;
    }

    if (showNotice) {
      showFeedback('Photo removed. Take a photo or upload anytime.', 'info', 3000);
    }
  }

  // Ensure clean initial state on page load
  removeActivePhoto(false);

  // --------------------------------------------------------------------------
  // Event Listeners for Photo Actions
  // --------------------------------------------------------------------------

  // 1. "Take a Photo" Button
  if (btnTakePhoto && cameraInput) {
    btnTakePhoto.addEventListener('click', () => {
      lastTriggerSource = 'camera';
      showFeedback(''); // clear previous message
      // Opens camera directly on supported mobile browsers, falls back gracefully
      cameraInput.click();
    });

    cameraInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      handleFileSelection(file);
    });

    // Listen for cancel event if supported by browser
    cameraInput.addEventListener('cancel', () => {
      if (!currentObjectUrl) {
        showFeedback('No photo was selected. You can take a photo or pick one from your gallery anytime.', 'info', 3500);
      }
    });
  }

  // 2. "Upload from Gallery" Button
  if (btnUploadGallery && galleryInput) {
    btnUploadGallery.addEventListener('click', () => {
      lastTriggerSource = 'gallery';
      showFeedback('');
      galleryInput.click();
    });

    galleryInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      handleFileSelection(file);
    });

    galleryInput.addEventListener('cancel', () => {
      if (!currentObjectUrl) {
        showFeedback('No photo was selected. You can take a photo or pick one from your gallery anytime.', 'info', 3500);
      }
    });
  }

  // 3. "Retake" Button
  if (btnRetakePhoto) {
    btnRetakePhoto.addEventListener('click', () => {
      showFeedback('');
      if (lastTriggerSource === 'camera' && cameraInput) {
        cameraInput.click();
      } else if (galleryInput) {
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
  const btnIdentify        = document.getElementById('btn-identify');
  const resultPanel        = document.getElementById('result-panel');
  const resultLoading      = document.getElementById('result-loading');
  const resultSuccess      = document.getElementById('result-success');
  const resultError        = document.getElementById('result-error');
  const resultConfBadge    = document.getElementById('result-confidence-badge');
  const resultEnglish      = document.getElementById('result-english');
  const resultKannada      = document.getElementById('result-kannada');
  const resultPronun       = document.getElementById('result-pronunciation');
  const resultDesc         = document.getElementById('result-description');
  const resultErrorMsg     = document.getElementById('result-error-message');
  const btnLearnWord            = document.getElementById('btn-learn-word');
  const btnSaveHistory          = document.getElementById('btn-save-history');
  const btnListenResult         = document.getElementById('btn-listen-result');
  const btnScanAnother          = document.getElementById('btn-scan-another');
  const btnResultSaveGarden     = document.getElementById('btn-result-save-garden');
  const btnResultSaveGardenText = document.getElementById('btn-result-save-garden-text');
  const btnModeGarden           = document.getElementById('btn-mode-garden');
  const learnGardenTabBadge     = document.getElementById('learn-garden-tab-badge');
  const apiSetupCard            = document.getElementById('api-setup-card');

  const btnHistoryOpen     = document.getElementById('btn-history-open');
  const historyCountBadge  = document.getElementById('history-count-badge');
  const historyOverlay     = document.getElementById('history-overlay');
  const btnHistoryClose    = document.getElementById('btn-history-close');
  const historyList        = document.getElementById('history-list');
  const historyEmpty       = document.getElementById('history-empty');
  const btnClearAll        = document.getElementById('btn-clear-all-history');

  const historyDetailOverlay = document.getElementById('history-detail-overlay');
  const historyDetailBody    = document.getElementById('history-detail-body');
  const btnDetailClose       = document.getElementById('btn-detail-close');

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
  // B. Image Compression (Canvas-based, max 1024px, JPEG 85%)
  //    Reduces payload before sending to the API proxy.
  // -------------------------------------------------------------------------
  function compressImageFile(file) {
    return new Promise((resolve) => {
      const MAX_SIDE = 1024;
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // Only downscale, never upscale
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

        // Also make a small thumbnail (96px for history list)
        const THUMB_SIZE = 96;
        const tRatio = Math.min(THUMB_SIZE / width, THUMB_SIZE / height);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width  = Math.round(width  * tRatio);
        thumbCanvas.height = Math.round(height * tRatio);
        thumbCanvas.getContext('2d').drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);

        resolve({
          dataUrl:    canvas.toDataURL('image/jpeg', 0.85),
          thumbUrl:   thumbCanvas.toDataURL('image/jpeg', 0.70),
          mimeType:   'image/jpeg',
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null); // Let the caller handle gracefully
      };

      img.src = url;
    });
  }

  // -------------------------------------------------------------------------
  // C. Show/Hide Result Panel States
  // -------------------------------------------------------------------------
  function showResultPanel(state) {
    resultPanel.hidden = false;
    resultLoading.hidden = (state !== 'loading');
    resultSuccess.hidden = (state !== 'success');
    resultError.hidden   = (state !== 'error');
  }

  function hideResultPanel() {
    resultPanel.hidden = true;
    currentResult = null;
    currentResultSaved = false;
  }

  // -------------------------------------------------------------------------
  // D. Populate Success Result State
  // -------------------------------------------------------------------------
  function displayResult(data) {
    currentResult = data;
    currentResultSaved = false;

    // Confidence badge
    resultConfBadge.textContent = data.confidence === 'high'
      ? 'Identified'
      : data.confidence === 'medium'
        ? 'Probable'
        : 'Possible';
    resultConfBadge.className = 'result-eyebrow';
    if (data.confidence === 'medium') resultConfBadge.classList.add('medium-confidence');
    if (data.confidence === 'low')    resultConfBadge.classList.add('low-confidence');

    resultEnglish.textContent  = data.english      || '';
    resultKannada.textContent  = data.kannada       || '';
    resultPronun.textContent   = data.pronunciation || '';
    resultDesc.textContent     = data.description   || '';

    // Reset save button
    btnSaveHistory.textContent = '';
    const saveIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    saveIcon.setAttribute('class', 'btn-icon');
    saveIcon.setAttribute('width', '18');
    saveIcon.setAttribute('height', '18');
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

    // Update Garden Save Button state for current result
    updateResultGardenButton(data);

    showResultPanel('success');
  }

  // -------------------------------------------------------------------------
  // E. Identify Object — Main Flow
  // -------------------------------------------------------------------------
  async function identifyObject() {
    if (!activeFile) {
      showFeedback('Please select a photo first.', 'info', 3000);
      return;
    }

    if (!apiConfigured) {
      showResultPanel('error');
      resultErrorMsg.textContent =
        'Object recognition is not set up yet. See the setup instructions below.';
      return;
    }

    // Show loading state
    showResultPanel('loading');
    btnIdentify.disabled = true;

    try {
      // 1. Compress image
      const compressed = await compressImageFile(activeFile);
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
          showResultPanel('error');
          resultErrorMsg.textContent =
            'The API key is not configured. Please follow the setup instructions below.';
          return;
        }

        // Person, unclear, text_only, api_error, server_error
        showResultPanel('error');
        resultErrorMsg.textContent = data.message ||
          'Something went wrong. Please try again with a clearer photo.';
        return;
      }

      // 5. Validate we have the essential fields
      if (!data.english || !data.kannada) {
        showResultPanel('error');
        resultErrorMsg.textContent =
          'The response was incomplete. Please try again or take a clearer photo.';
        return;
      }

      // 6. Store the thumbnail for later history saving
      if (compressed) {
        data._thumbnailUrl = compressed.thumbUrl;
        data._fullDataUrl  = compressed.dataUrl;
      }

      displayResult(data);

    } catch (err) {
      console.error('[Identify Error]', err);
      showResultPanel('error');

      if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        resultErrorMsg.textContent =
          'Could not reach the server. Make sure the server (run this.bat) is running.';
      } else {
        resultErrorMsg.textContent =
          err.message || 'An unexpected error occurred. Please try again.';
      }
    } finally {
      btnIdentify.disabled = false;
    }
  }

  if (btnIdentify) {
    btnIdentify.addEventListener('click', identifyObject);
  }

  // -------------------------------------------------------------------------
  // F. "Learn This Word" — connects to LEARN tab (future: passes the word)
  // -------------------------------------------------------------------------
  if (btnLearnWord) {
    btnLearnWord.addEventListener('click', () => {
      // Store the current word so LEARN section can pick it up in later steps
      if (currentResult) {
        try {
          sessionStorage.setItem('nammooru_featured_word', JSON.stringify({
            english:       currentResult.english,
            kannada:       currentResult.kannada,
            pronunciation: currentResult.pronunciation,
          }));
        } catch { /* ignore storage errors */ }
      }
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
      btnResultSaveGardenText.textContent = isSaved ? '✓ In Garden' : 'Add to Word Garden';
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
      const raw = localStorage.getItem(HISTORY_KEY);
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
    renderHistoryList();
  }

  if (btnHistoryOpen)  btnHistoryOpen.addEventListener('click',  openHistoryModal);
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
      const voices = window.speechSynthesis.getVoices();
      kannadaSpeechVoice = voices.find(v => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return lang === 'kn-in' || lang.startsWith('kn') || name.includes('kannada') || name.includes('ಕನ್ನಡ');
      }) || null;

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
      currentlyPlayingBtn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>Listen</span>
      `;
      currentlyPlayingBtn = null;
    }

    // 4. Hide Global Pill
    if (audioPlayerPill) audioPlayerPill.hidden = true;
  }

  if (btnStopAudio) {
    btnStopAudio.addEventListener('click', stopAllAudio);
  }

  /**
   * Speaks the provided Kannada text with visual feedback.
   * Prioritizes browser's kn-IN voice when available; falls back to /api/tts.
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
      btn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
        <span>Stop</span>
      `;
    }

    if (audioPlayerPill) {
      audioPlayerPill.hidden = false;
      if (audioPillLabel) audioPillLabel.textContent = `Speaking: ${text}`;
    }

    // Path A: Native browser speech synthesis with a Kannada voice
    if (isSpeechSynthesisSupported && kannadaSpeechVoice) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = kannadaSpeechVoice;
        u.lang = 'kn-IN';
        u.rate = 0.9; // deliberate pace for learners
        u.pitch = 1.0;

        u.onend = () => {
          if (currentlyPlayingBtn === btn) stopAllAudio();
        };

        u.onerror = (e) => {
          console.warn('[SpeechSynthesis Error, falling back to server TTS]', e);
          playViaServerTts(text, btn);
        };

        activeUtterance = u;
        window.speechSynthesis.speak(u);
        return;
      } catch (err) {
        console.warn('[SpeechSynthesis failed, trying server TTS]', err);
      }
    }

    // Path B: Fallback to server audio proxy (/api/tts)
    playViaServerTts(text, btn);
  }

  /**
   * Streams native Kannada pronunciation audio via /api/tts.
   */
  function playViaServerTts(text, btn) {
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.onended = () => {
      if (currentlyPlayingBtn === btn) stopAllAudio();
    };

    audio.onerror = () => {
      console.warn('[Audio Playback Error] Could not stream audio from /api/tts');
      showFeedback('Could not play audio pronunciation. Please ensure the server is running.', 'error', 3500);
      stopAllAudio();
    };

    audio.play().catch(err => {
      console.warn('[Audio play failed]', err);
      stopAllAudio();
    });
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
        const raw = localStorage.getItem(STORAGE_KEY);
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
        notifyListeners(items);
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
      openGardenModal();
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
      openGardenModal();
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
      scriptSectionDesc.textContent = isVowels
        ? 'Tap any Listen button to hear authentic pronunciation. Vowels are the melodious base of spoken Kannada.'
        : 'Organized into structured sound families (Velar, Palatal, Retroflex, Dental, Labial) and independent consonants.';
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

      const glyph = document.createElement('div');
      glyph.className = 'script-glyph';
      glyph.setAttribute('lang', 'kn');
      glyph.textContent = item.char;

      const meta = document.createElement('div');
      meta.className = 'script-meta';

      const name = document.createElement('span');
      name.className = 'script-name';
      name.textContent = item.name;

      const sound = document.createElement('span');
      sound.className = 'script-sound';
      sound.textContent = item.translit;

      meta.appendChild(name);
      meta.appendChild(sound);

      if (item.exampleKn) {
        const eg = document.createElement('span');
        eg.className = 'script-example';
        eg.textContent = `${item.exampleKn} — ${item.exampleEn || ''}`;
        meta.appendChild(eg);
      }

      // Listen Button
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

      card.appendChild(glyph);
      card.appendChild(meta);
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
  // WORD GARDEN UI CONTROLLER (Step 5)
  // =========================================================================
  const btnGardenHeader        = document.getElementById('btn-garden-header');
  const headerGardenBadge      = document.getElementById('header-garden-badge');
  const btnOpenGardenFromLearn = document.getElementById('btn-open-garden-from-learn');
  const learnGardenCount       = document.getElementById('learn-garden-count');
  const gardenOverlay          = document.getElementById('garden-overlay');
  const btnGardenClose         = document.getElementById('btn-garden-close');
  const gardenTotalCount       = document.getElementById('garden-total-count');
  const gardenWordsSubcount    = document.getElementById('garden-words-subcount');
  const gardenPhrasesSubcount  = document.getElementById('garden-phrases-subcount');
  const gardenSearchInput      = document.getElementById('garden-search-input');
  const btnGardenSearchClear   = document.getElementById('btn-garden-search-clear');
  const gardenCategorySelect   = document.getElementById('garden-category-select');
  const gardenTypePills        = Array.from(document.querySelectorAll('.garden-pill-btn'));
  const gardenEmptyState       = document.getElementById('garden-empty-state');
  const gardenNoResults        = document.getElementById('garden-no-results');
  const gardenItemsGrid        = document.getElementById('garden-items-grid');
  const btnEmptyGotoLearn      = document.getElementById('btn-empty-goto-learn');
  const btnGardenResetFilters  = document.getElementById('btn-garden-reset-filters');

  let gardenSearchQuery = '';
  let gardenTypeFilter = 'all';
  let gardenCategoryFilter = 'all';

  function updateGardenBadges() {
    const { total, words, phrases } = GardenStore.count();

    // 1. Header quick pill
    const headerCountEl = document.getElementById('header-garden-count');
    if (headerCountEl) {
      headerCountEl.textContent = total;
    }
    if (headerGardenBadge) {
      headerGardenBadge.textContent = total;
      headerGardenBadge.hidden = (total === 0);
    }

    // 2. Profile stats
    const profileGardenEl = document.getElementById('profile-garden-count');
    if (profileGardenEl) {
      profileGardenEl.textContent = total;
    }

    // 3. Learn page hero card badge
    if (learnGardenCount) {
      learnGardenCount.textContent = total;
      learnGardenCount.hidden = (total === 0);
    }

    // 4. Modal stats strip
    if (gardenTotalCount) {
      gardenTotalCount.textContent = total;
    }
    if (gardenWordsSubcount) {
      gardenWordsSubcount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    }
    if (gardenPhrasesSubcount) {
      gardenPhrasesSubcount.textContent = `${phrases} ${phrases === 1 ? 'phrase' : 'phrases'}`;
    }
  }

  // Header garden pill click handler
  const btnHeaderGarden = document.getElementById('btn-header-garden');
  if (btnHeaderGarden) {
    btnHeaderGarden.addEventListener('click', openGardenModal);
  }

  function openGardenModal() {
    if (!gardenOverlay) return;
    gardenOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    updateGardenBadges();
    renderGardenItems();
    if (btnGardenClose) btnGardenClose.focus();
  }

  function closeGardenModal() {
    if (!gardenOverlay) return;
    gardenOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  function formatCategoryName(cat) {
    if (!cat) return 'General';
    const map = {
      greetings: 'Greetings',
      numbers: 'Numbers & Money',
      food: 'Food & Dining',
      transport: 'Transport',
      directions: 'Directions',
      shopping: 'Shopping & Prices',
      auto: 'Auto & Commute',
      polite: 'Politeness',
      daily: 'Daily Life',
      everyday: 'Everyday'
    };
    return map[cat.toLowerCase()] || (cat.charAt(0).toUpperCase() + cat.slice(1));
  }

  function renderGardenItems() {
    if (!gardenItemsGrid) return;
    const allItems = GardenStore.getAll();

    // 1. Overall empty state
    if (allItems.length === 0) {
      if (gardenEmptyState) gardenEmptyState.hidden = false;
      if (gardenNoResults) gardenNoResults.hidden = true;
      gardenItemsGrid.hidden = true;
      gardenItemsGrid.innerHTML = '';
      return;
    }

    // 2. Filter items
    const filtered = allItems.filter(item => {
      // Type filter
      if (gardenTypeFilter !== 'all' && item.type !== gardenTypeFilter) {
        return false;
      }
      // Category filter
      if (gardenCategoryFilter !== 'all' && item.category !== gardenCategoryFilter) {
        return false;
      }
      // Search filter
      if (gardenSearchQuery) {
        const q = gardenSearchQuery.toLowerCase();
        const matchesKannada = (item.kannada || '').toLowerCase().includes(q);
        const matchesTranslit = (item.translit || '').toLowerCase().includes(q);
        const matchesEnglish = (item.english || '').toLowerCase().includes(q);
        const matchesNote = (item.note || '').toLowerCase().includes(q);
        if (!matchesKannada && !matchesTranslit && !matchesEnglish && !matchesNote) {
          return false;
        }
      }
      return true;
    });

    // 3. No search / filter matches state
    if (filtered.length === 0) {
      if (gardenEmptyState) gardenEmptyState.hidden = true;
      if (gardenNoResults) gardenNoResults.hidden = false;
      gardenItemsGrid.hidden = true;
      gardenItemsGrid.innerHTML = '';
      return;
    }

    // 4. Render matched items
    if (gardenEmptyState) gardenEmptyState.hidden = true;
    if (gardenNoResults) gardenNoResults.hidden = true;
    gardenItemsGrid.hidden = false;
    gardenItemsGrid.innerHTML = '';

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'garden-card';
      card.id = `garden-card-${item.id}`;

      // Meta: Type pill + Category
      const meta = document.createElement('div');
      meta.className = 'garden-card-meta';

      const typeBadge = document.createElement('span');
      typeBadge.className = 'garden-badge-type';
      typeBadge.textContent = item.type === 'phrase' ? 'Phrase' : 'Word';

      const catBadge = document.createElement('span');
      catBadge.className = 'garden-badge-cat';
      catBadge.textContent = formatCategoryName(item.category);

      meta.appendChild(typeBadge);
      meta.appendChild(catBadge);

      // Kannada script (large readable font)
      const kn = document.createElement('div');
      kn.className = 'garden-card-kannada';
      kn.setAttribute('lang', 'kn');
      kn.textContent = item.kannada;

      // Transliteration
      const translit = document.createElement('div');
      translit.className = 'garden-card-translit';
      translit.textContent = item.translit;

      // English meaning
      const eng = document.createElement('div');
      eng.className = 'garden-card-english';
      eng.textContent = item.english;

      // Note / Usage if available
      let note = null;
      if (item.note) {
        note = document.createElement('div');
        note.className = 'garden-card-note';
        note.textContent = item.note;
      }

      // Actions strip
      const actions = document.createElement('div');
      actions.className = 'garden-card-actions';

      // 1. Listen Button (Connects to actual Step 4 pronunciation)
      const listenBtn = document.createElement('button');
      listenBtn.type = 'button';
      listenBtn.className = 'btn-listen';
      listenBtn.setAttribute('aria-label', `Listen to ${item.english}`);
      listenBtn.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>Listen</span>
      `;
      listenBtn.addEventListener('click', () => {
        playKannadaAudio(item.listenText || item.kannada, listenBtn);
      });

      // 2. View in Learn Button
      const viewLearnBtn = document.createElement('button');
      viewLearnBtn.type = 'button';
      viewLearnBtn.className = 'btn-garden-view-learn';
      viewLearnBtn.setAttribute('aria-label', `View ${item.english} in Learn section`);
      viewLearnBtn.innerHTML = `
        <span>View in Learn</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
      viewLearnBtn.addEventListener('click', () => {
        closeGardenModal();
        switchSection('learn');
        const targetMode = item.type === 'phrase' ? 'phrases' : 'words';
        switchLearnMode(targetMode);

        // Reset search in Learn so the card is visible
        if (learnSearchInput) {
          learnSearchInput.value = '';
          currentSearchQuery = '';
          if (btnSearchClear) btnSearchClear.hidden = true;
        }

        // Set category to item's category so the card is visible
        if (targetMode === 'words') {
          currentWordCategory = item.category || 'all';
          wordsCategoryBar.querySelectorAll('.cat-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === currentWordCategory);
          });
          renderWordsGrid();
        } else {
          currentPhraseCategory = item.category || 'all';
          phrasesCategoryBar.querySelectorAll('.cat-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === currentPhraseCategory);
          });
          renderPhrasesGrid();
        }

        // Smooth scroll and pulse highlight
        setTimeout(() => {
          const cardId = item.type === 'phrase' ? `phrase-${item.id}` : `word-${item.id}`;
          const targetCard = document.getElementById(cardId);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.remove('card-highlighted');
            void targetCard.offsetWidth; // trigger reflow
            targetCard.classList.add('card-highlighted');
          }
        }, 150);
      });

      // 3. Remove Button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-garden-remove';
      removeBtn.setAttribute('aria-label', `Remove ${item.english} from Word Garden`);
      removeBtn.setAttribute('title', 'Remove from Word Garden');
      removeBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      `;
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        GardenStore.remove(item.id);
        showGardenToast('Removed from your Word Garden.', 'info');
      });

      actions.appendChild(listenBtn);
      actions.appendChild(viewLearnBtn);
      actions.appendChild(removeBtn);

      card.appendChild(meta);
      card.appendChild(kn);
      card.appendChild(translit);
      card.appendChild(eng);
      if (note) card.appendChild(note);
      card.appendChild(actions);

      gardenItemsGrid.appendChild(card);
    });
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
  if (gardenOverlay) {
    gardenOverlay.addEventListener('click', (e) => {
      if (e.target === gardenOverlay) closeGardenModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gardenOverlay && !gardenOverlay.hidden) {
      closeGardenModal();
    }
  });

  if (btnEmptyGotoLearn) {
    btnEmptyGotoLearn.addEventListener('click', () => {
      closeGardenModal();
      switchSection('learn');
      switchLearnMode('words');
    });
  }

  // Type filter pills (All, Words, Phrases)
  gardenTypePills.forEach(btn => {
    btn.addEventListener('click', () => {
      gardenTypePills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gardenTypeFilter = btn.dataset.type || 'all';
      renderGardenItems();
    });
  });

  // Category select dropdown
  if (gardenCategorySelect) {
    gardenCategorySelect.addEventListener('change', () => {
      gardenCategoryFilter = gardenCategorySelect.value;
      renderGardenItems();
    });
  }

  // Search input
  if (gardenSearchInput) {
    gardenSearchInput.addEventListener('input', () => {
      gardenSearchQuery = gardenSearchInput.value.trim();
      if (btnGardenSearchClear) {
        btnGardenSearchClear.hidden = (gardenSearchQuery === '');
      }
      renderGardenItems();
    });
  }

  // Clear search button
  if (btnGardenSearchClear) {
    btnGardenSearchClear.addEventListener('click', () => {
      gardenSearchInput.value = '';
      gardenSearchQuery = '';
      btnGardenSearchClear.hidden = true;
      gardenSearchInput.focus();
      renderGardenItems();
    });
  }

  // Reset all filters button
  if (btnGardenResetFilters) {
    btnGardenResetFilters.addEventListener('click', () => {
      gardenSearchQuery = '';
      gardenTypeFilter = 'all';
      gardenCategoryFilter = 'all';
      if (gardenSearchInput) gardenSearchInput.value = '';
      if (btnGardenSearchClear) btnGardenSearchClear.hidden = true;
      if (gardenCategorySelect) gardenCategorySelect.value = 'all';
      gardenTypePills.forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
      renderGardenItems();
    });
  }

  // Subscribe GardenStore changes to keep everything synced reactively
  GardenStore.subscribe(() => {
    updateGardenBadges();
    updateAllSaveButtons();
    if (currentResult) updateResultGardenButton(currentResult);
    if (gardenOverlay && !gardenOverlay.hidden) {
      renderGardenItems();
    }
  });

  // Initial Badges Sync
  updateGardenBadges();


  // --- Initial Render of Learn Content ---
  renderScriptGrid();

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
  const AttemptStore = (() => {
    const STORAGE_KEY = 'nammooru_attempts_v1';
    const listeners = new Set();

    function readStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
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
        listeners.forEach(fn => {
          try { fn(items); } catch (e) { console.error('[AttemptStore listener error]', e); }
        });
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
  });

  // Global Escape key handler for all modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (badgeDetailModal && !badgeDetailModal.hidden) closeBadgeDetailModal();
      if (attemptDetailModal && !attemptDetailModal.hidden) closeAttemptDetailModal();
      if (gardenPickerModal && !gardenPickerModal.hidden) closeGardenPicker();
      if (modalCreatePost && !modalCreatePost.hidden) closeCreatePostModal();
      if (modalEditProfile && !modalEditProfile.hidden) closeEditProfileModal();
    }
  });

  // Expose stores for modularity and verification
  window.ProfileStore = ProfileStore;
  window.CommunityStore = CommunityStore;

  // Initial Sync
  syncProfileCard();
  renderCommunityFeed();

});


