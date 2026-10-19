# NAMMOORU — DESIGN SYSTEM & ARCHITECTURE SPECIFICATION (V3)
## Translucent Mirror Glass & 4-Destination Primary Architecture

### 1. Visual Language & Aesthetics
Nammooru adopts a **Translucent Smoked Mirror-Glass** aesthetic layered over an atmospheric obsidian canvas (`#0D1115`) with volumetric red (`#B9434B`) and teal (`#12BDB4`) illumination.

- **Mirror-Glass Surfaces**: Replaces flat, opaque white cards with multi-layered, three-dimensional translucent mirror surfaces:
  - Base Glass: `rgba(255, 255, 255, 0.12)` to `rgba(255, 255, 255, 0.18)`
  - Edge Highlights: `1px solid rgba(255, 255, 255, 0.24)`
  - Specular Inset Reflections: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08)`
  - Backdrop Blur: `blur(20px)`
  - Soft Directional Depth Shadows: `0 16px 36px -4px rgba(0, 0, 0, 0.65), 0 4px 12px -2px rgba(0, 0, 0, 0.45)`
- **High-Contrast Typographic Inks**:
  - Primary Headlines: `#FFFFFF` (crisp white, high readability)
  - Secondary Inks: `rgba(247, 243, 238, 0.90)` (WCAG AAA compliant)
  - Transliterations: `#76B9AE` (soft luminous teal)
  - Kannada Typography: `Noto Sans Kannada` with generous line-height
  - Editorial Accents: `Playfair Display Italic`

---

### 2. Main Navigation Dock (Exactly 4 Destinations)
The bottom floating dock (`.app-tabbar`) features **four balanced destinations**:
1. **Photo** (`#tab-photo`): Optical viewfinder studio, live camera capture, gallery upload, object specimen discovery.
2. **Learn** (`#tab-learn`): Classic curriculum mode switcher (Script, Words, Phrases, Word Garden) with search and audio pronunciation.
3. **Innovate** (`#tab-innovate`): Real-world practice and courage recognition.
4. **Transform** (`#tab-transform`): Profile-first supportive community and shared experiences.

Each dock button provides touch target $\ge 52\text{px} \times 48\text{px}$, ARIA tab semantics, keyboard navigation (ArrowLeft, ArrowRight, Home, End), and active pill indicators.

---

### 3. Innovate Architecture & Organization
Innovate is organised into five distinct, usable sections:
1. **Log a Try**: Prominent action card (`#form-record-attempt`) allowing newcomers to record speaking moments in Bengaluru.
   - Connected Word Garden picker integration.
   - Quick scenario template chips (Darshini coffee, auto meter, asking prices, namaskara, metro directions).
   - Category selector (Shopping, Prices, Negotiation, Food, Transport, Everyday, Courage).
   - **Three Non-Judgmental Outcomes**:
     - *It went well* (`went_well` - Understood, felt natural)
     - *I needed help* (`needed_help` - Switched to English/gestures, but tried)
     - *I froze* (`froze` - Hesitated or stumbled; celebrated for stepping up)
     - Copy reassurance: All 3 outcomes count equally as a try and receive the full reward.
   - Optional reflection note.
2. **My Week**: Factual weekly summary strip:
   - Tries this week (filtered from attempts in last 7 days)
   - Words learned (words in Word Garden)
   - Words tried (attempts recorded)
3. **My Badges**: Achievements catalog organized by meaningful Bengaluru categories:
   - Shopping (`Local Shopper`)
   - Prices & payments (`Price & Numbers`)
   - Negotiation (`Polite Negotiation`)
   - Food & ordering (`Darshini Regular`)
   - Directions & transport (`City Navigator`)
   - Everyday conversations (`Warm Neighbour`)
   - Courage & trying (`First Leap`, `Brave Heart`, `Steady Explorer`)
4. **Badge Details**: Selecting any badge opens an inspection modal (`#badge-detail-modal`) showing:
   - Title, Kannada name, icon emblem, criteria text, progress bar.
   - **Actual Supporting Attempts**: Displays the user's real saved conversation records that contributed to unlocking the badge.
5. **My Progress**:
   - Total attempts logged, words in garden, badges unlocked.
   - Attempt outcomes breakdown (Went well count, Needed help count, Froze count).
   - Practice Log timeline with outcome filters (All, Went Well, Needed Help, Froze).
   - Zero points, streaks, levels, ranks, leaderboards, or competitive scoring.

---

### 4. Restored Learn Page Layout
- Restores the familiar single-level mode-switching structure:
  - Script mode (`#panel-learn-script`): Vowels (15) vs Consonants (34) with audio pronunciation.
  - Words mode (`#panel-learn-words`): 8 categories, 51 vocabulary cards with audio and garden bookmarking.
  - Phrases mode (`#panel-learn-phrases`): 6 daily life categories.
  - Word Garden mode: Modal inspection of personal bookmarks.
- Retains improved typography: Helvetica Neue weights, Playfair Display Italic accents, and readable Kannada script.

---

### 5. Impeccable Quality Audit
- `impeccable detect` result: `[]` (0 warnings, 0 anti-patterns, 0 slop).
- No zero-offset colored glows (all shadows are neutral, directional elevations).
- No side-tabs or asymmetric border-left indicators.
- Minimum font-size $\ge 13.1\text{px}$ (`0.82rem`).
- Contrast ratio $\ge 4.5:1$ across all translucent mirror glass surfaces.
