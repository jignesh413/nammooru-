# NAMMOORU — COMPLETE CHAT HISTORY, ARCHITECTURE & PROJECT CONTEXT

> **Project Name:** Nammooru  
> **Brand Identity:** Pure Typography ("Nammooru") — No logo icon, no emblem, no Kannada prefix in brand chrome.  
> **Primary Audience:** Newcomers living in Bengaluru learning to speak and understand conversational Kannada.  
> **Aesthetic & Art Direction:** Studio-grade digital product inspired by Phenomenon Studio (editorial typography, light lavender `#EDEBF5` canvas, near-black navy `#010219`, deep blue `#091A55`, periwinkle `#4151B3`, restrained surfaces, hairline dividers).

---

## 1. Complete Chronology of Chat Sessions & User Prompts

### Session 1 — Learn Page Repair & Audio Pronunciation (Step 4)
- **Goal:** Ensure the Learn section visibly renders 3 structured learning modes: Script (15 Vowels, 34 Consonants), Words (50+ core daily vocabulary items across categories), and Phrases (20+ everyday Bengaluru commute/dining phrases).
- **Fixes Applied:** Implemented native Web SpeechSynthesis audio fallback for Kannada (`kn-IN`) and integrated backend `/api/tts` endpoint. Structured `learn-data.js` with accurate Kannada script, transliteration, and English meanings.

### Session 2 — Word Garden Implementation (Step 5)
- **Goal:** Create a personal growing collection of saved vocabulary called **Word Garden** (*"Every word you learn brings you a little closer to feeling at home"*).
- **Fixes Applied:** Built `GardenStore` with `localStorage` key `nammooru_garden_v1`. Added bookmark buttons on every word/phrase card, quick counter in the header, and an interactive modal (`#garden-overlay`) with real-time search and category filtering.

### Session 3 & 4 — Navigation Architecture & Critical Functionality Restorations
- **Goal:** Diagnose and resolve static page issues where UI buttons were non-interactive or blocked by overlays. Relocate Word Garden inside Learn rather than in the main navigation.
- **Fixes Applied:** Restored active click handlers, fixed modal backdrop z-indexes (`100`), verified Python HTTP server on port 8000, and prevented scroll-lock regressions.

### Session 5 — Steps 6–11 Master Implementation
- **Goal:** Implement the complete product vision across **Innovate** (Real-World Practice) and **Transform** (Community).
- **Innovate Features:**
  - 3 Encouraging Practice Outcomes:
    1. *Went well* (Green dot — Smooth, encouraging interaction)
    2. *Needed help* (Amber dot — Switched to English/gestures)
    3. *Froze in the moment* (Rose dot — Hesitated or forgot words; celebrating courage)
  - 9 Transparent Badges evaluated against real-world criteria (e.g., *First Leap*, *Darshini Regular*, *Market Navigator*, *Auto Whisperer*, *Persistent Voice*, etc.).
  - Detailed Activity Log Book with expandable practice moments.
- **Transform Features:**
  - Community discussion feed with category filters (*Success Stories*, *Useful Phrases*, *Questions/Help*, *Bengaluru Tips*).
  - Share post modal with instant local persistence.
  - Helpful / Upvote button with persisted vote state.
  - User Profile card displaying name, bio, earned badges count, total attempts, and edit profile modal.

### Session 6 — Git Version Control & Deployment Setup
- **Goal:** Initialize Git repository and link to remote `https://github.com/jignesh413/nammooru-`.
- **Fixes Applied:** Configured git remote, verified branch structure, and created `.gitignore`.

### Session 7 — Strict Visual Redesign & Art Direction
- **Goal:** Full visual redesign following strict art direction and non-negotiable brand rules:
  1. **Exact Wordmark:** Strictly **Nammooru** (no logo, no symbol, no Kannada translations in UI chrome).
  2. **English Chrome:** Navigation, buttons, kickers, and instructions in clear English; Kannada script strictly restricted to genuine learning content.
  3. **Distinct Optical Photo Canvas:** Dark sapphire viewfinder aperture (`linear-gradient(160deg, #091A55 0%, #010219 100%)`) with animated reticle lines and clear shutter/upload hierarchy.
  4. **Segmented Bottom Dock:** Redesigned dock featuring a distinct focal Photo tab on the left, a hairline divider, and a unified 3-column group for `[Learn] [Innovate] [Transform]`.
  5. **Removal of Card-on-Card Look:** Clean single-level surface hierarchy with 16px corner radii and 1px hairline borders.

---

## 2. Technical Stack & File Structure

```
f:\antigravity projects\nammooru\
├── index.html          # Semantic HTML5 shell, 4 view sections, 7 modal dialogs
├── style.css           # Vanilla CSS Design System, tokens, typography, dark studio canvas, dock
├── script.js           # Vanilla ES6+ JS: Navigation, Photo, GardenStore, AttemptStore, CommunityStore, ProfileStore
├── learn-data.js       # Kannada learning database: Vowels, Consonants, Words, Phrases
├── server.py           # Multi-threaded Python server with AI vision API (/api/identify) and TTS (/api/tts)
├── server.ps1          # PowerShell launcher script
├── run this.bat        # 1-click Windows launcher for local server & browser
├── hero-bengaluru.jpg  # Optimized local image asset
└── package.json        # Project metadata
```

---

## 3. Design System & Style Tokens

### Color Palette
- **Canvas / Background:** Light Lavender `#EDEBF5`
- **Primary Headlines & Wordmark:** Near-Black Navy `#010219`
- **Optical Studio & Dark Accents:** Deep Blue `#091A55`
- **Interactive Accent:** Electric Periwinkle `#4151B3` (Hover: `#33429E`)
- **Supporting / Metadata:** Soft Purple-Grey `#9892B3` / `#78738E`
- **Borders & Dividers:** Muted Lavender `rgba(178, 169, 207, 0.42)`
- **Surfaces:** Pure Matte White `#FFFFFF` and Tonal Lavender `#F4F2FA`

### Typography
- **English UI & Headlines:** `'Plus Jakarta Sans', system-ui, sans-serif`
- **Kannada Script Content:** `'Noto Sans Kannada', system-ui, sans-serif`

### Radii & Spacing
- **Dock & Major Cards:** `16px`
- **Secondary Cards & Inputs:** `12px` / `10px`
- **Pills / Badges:** `100px`
- **App Max Width:** `440px` (centered on desktop with responsive frame)

---

## 4. Local Storage Schema & Data Stores

| Store | Storage Key | Schema / Purpose |
| :--- | :--- | :--- |
| `GardenStore` | `nammooru_garden_v1` | Array of saved words/phrases (`id`, `kannada`, `translit`, `english`, `type`, `category`, `addedAt`). |
| `AttemptStore` | `nammooru_attempts_v1`| Array of logged real-world practice moments (`id`, `situation`, `category`, `outcome`, `note`, `linkedGardenId`, `timestamp`). |
| `CommunityStore`| `nammooru_community_v1`| Community posts array (`id`, `title`, `content`, `category`, `authorName`, `createdAt`, `helpfulCount`, `userVoted`). |
| `ProfileStore`  | `nammooru_profile_v1`  | User profile object (`name`, `bio`, `joinedDate`). |

---

## 5. Modal Dialogs Architecture

All 7 modals use `.modal-overlay` with `backdrop-filter: blur(12px)`, ARIA attributes, and global `Escape` key listeners:
1. `#history-overlay` — Photo discovery log book
2. `#history-detail-overlay` — Single photo entry detail
3. `#garden-overlay` — Full Word Garden collection with search and filtering
4. `#garden-picker-modal` — Quick selector to link a Word Garden item to a practice attempt
5. `#badge-detail-modal` — Badge criteria and supporting practice moments
6. `#attempt-detail-modal` — Full view of a past practice record
7. `#modal-create-post` — New community discussion form
8. `#modal-edit-profile` — Display name & introduction editor

---

## 6. How to Resume Work in a New Window

When opening a new chat window, simply refer to this document or paste the prompt:

> *"Continue development of Nammooru based on [CHAT_HISTORY_AND_PROJECT_SUMMARY.md](file:///f:/antigravity%20projects/nammooru/CHAT_HISTORY_AND_PROJECT_SUMMARY.md). The project has a verified studio-grade visual redesign, running server on http://localhost:8000, 4 core sections (Photo, Learn, Innovate, Transform), and complete local storage persistence."*
