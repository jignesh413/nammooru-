/**
 * ============================================================================
 * Nammooru — Authentic Kannada Learning Curriculum Data (Step 4)
 * ============================================================================
 * 
 * Carefully verified Kannada learning data organized into three modes:
 * 1. SCRIPT  — Vowels (ಸ್ವರಗಳು) and Consonants (ವ್ಯಂಜನಗಳು) with sound guides
 * 2. WORDS   — High-utility vocabulary across 7 everyday categories
 * 3. PHRASES — Essential real-life sentences for Bengaluru newcomers
 * 
 * All Kannada script is authentic Unicode. Transliterations use standard
 * intuitive Latin phonetics for English speakers.
 */

window.NAMMOORU_LEARN_DATA = {
  // ==========================================================================
  // 1. SCRIPT — KANNADA ALPHABET (ವರ್ಣಮಾಲೆ - Varnamaale)
  // ==========================================================================
  script: {
    vowels: [
      {
        id: 'v_a',
        char: 'ಅ',
        name: 'Akāra',
        group: 'Short Vowels (ಹ್ರಸ್ವ)',
        translit: 'a',
        soundLike: 'Short "u" like in cup, bun',
        exampleKn: 'ಅಮ್ಮ',
        exampleEn: 'Amma (Mother)',
        listenText: 'ಅ, ಅಮ್ಮ'
      },
      {
        id: 'v_aa',
        char: 'ಆ',
        name: 'Aakāra',
        group: 'Long Vowels (ದೀರ್ಘ)',
        translit: 'aa / ā',
        soundLike: 'Long "aa" like in father, car',
        exampleKn: 'ಆನೆ',
        exampleEn: 'Aane (Elephant)',
        listenText: 'ಆ, ಆನೆ'
      },
      {
        id: 'v_i',
        char: 'ಇ',
        name: 'Ikāra',
        group: 'Short Vowels (ಹ್ರಸ್ವ)',
        translit: 'i',
        soundLike: 'Short "i" like in sit, pin',
        exampleKn: 'ಇಲಿ',
        exampleEn: 'Ili (Mouse)',
        listenText: 'ಇ, ಇಲಿ'
      },
      {
        id: 'v_ee',
        char: 'ಈ',
        name: 'Eekāra',
        group: 'Long Vowels (ದೀರ್ಘ)',
        translit: 'ee / ī',
        soundLike: 'Long "ee" like in feel, meet',
        exampleKn: 'ಈಜು',
        exampleEn: 'Eeju (Swim)',
        listenText: 'ಈ, ಈಜು'
      },
      {
        id: 'v_u',
        char: 'ಉ',
        name: 'Ukāra',
        group: 'Short Vowels (ಹ್ರಸ್ವ)',
        translit: 'u',
        soundLike: 'Short "u" like in put, book',
        exampleKn: 'ಉಪ್ಪು',
        exampleEn: 'Uppu (Salt)',
        listenText: 'ಉ, ಉಪ್ಪು'
      },
      {
        id: 'v_oo',
        char: 'ಊ',
        name: 'Ookāra',
        group: 'Long Vowels (ದೀರ್ಘ)',
        translit: 'oo / ū',
        soundLike: 'Long "oo" like in moon, rule',
        exampleKn: 'ಊಟ',
        exampleEn: 'Oota (Meal / Lunch)',
        listenText: 'ಊ, ಊಟ'
      },
      {
        id: 'v_ru',
        char: 'ಋ',
        name: 'Rukāra',
        group: 'Vocalic (ಸ್ವರ)',
        translit: 'ru / ṛ',
        soundLike: '"ru" like in ripple, rhythm',
        exampleKn: 'ಋಷಿ',
        exampleEn: 'Rushi (Sage)',
        listenText: 'ಋ, ಋಷಿ'
      },
      {
        id: 'v_e',
        char: 'ಎ',
        name: 'Ekāra (Short)',
        group: 'Short Vowels (ಹ್ರಸ್ವ)',
        translit: 'e',
        soundLike: 'Short "e" like in pen, bed',
        exampleKn: 'ಎಲೆ',
        exampleEn: 'Ele (Leaf)',
        listenText: 'ಎ, ಎಲೆ'
      },
      {
        id: 'v_ae',
        char: 'ಏ',
        name: 'Aekāra (Long)',
        group: 'Long Vowels (ದೀರ್ಘ)',
        translit: 'ae / ē',
        soundLike: 'Long "ay" like in play, day',
        exampleKn: 'ಏಣಿ',
        exampleEn: 'Aeni (Ladder)',
        listenText: 'ಏ, ಏಣಿ'
      },
      {
        id: 'v_ai',
        char: 'ಐ',
        name: 'Aikāra',
        group: 'Diphthongs (ಸಂಧ್ಯಕ್ಷರ)',
        translit: 'ai',
        soundLike: '"ai" like in eye, bike',
        exampleKn: 'ಐದು',
        exampleEn: 'Aidu (Five)',
        listenText: 'ಐ, ಐದು'
      },
      {
        id: 'v_o',
        char: 'ಒ',
        name: 'Okāra (Short)',
        group: 'Short Vowels (ಹ್ರಸ್ವ)',
        translit: 'o',
        soundLike: 'Short "o" like in hot, pot',
        exampleKn: 'ಒಂದು',
        exampleEn: 'Ondu (One)',
        listenText: 'ಒ, ಒಂದು'
      },
      {
        id: 'v_oa',
        char: 'ಓ',
        name: 'Oakāra (Long)',
        group: 'Long Vowels (ದೀರ್ಘ)',
        translit: 'oa / ō',
        soundLike: 'Long "oa" like in boat, go',
        exampleKn: 'ಓಟ',
        exampleEn: 'Oata (Run)',
        listenText: 'ಓ, ಓಟ'
      },
      {
        id: 'v_au',
        char: 'ಔ',
        name: 'Aukāra',
        group: 'Diphthongs (ಸಂಧ್ಯಕ್ಷರ)',
        translit: 'au',
        soundLike: '"ow" like in cow, out',
        exampleKn: 'ಔಷಧ',
        exampleEn: 'Aushadha (Medicine)',
        listenText: 'ಔ, ಔಷಧ'
      },
      {
        id: 'v_am',
        char: 'ಅಂ',
        name: 'Anusvāra',
        group: 'Modifiers (ಯೋಗವಾಹ)',
        translit: 'am',
        soundLike: 'Nasal "am / an" like in umbrella',
        exampleKn: 'ಅಂಗಡಿ',
        exampleEn: 'Angadi (Shop)',
        listenText: 'ಅಂ, ಅಂಗಡಿ'
      },
      {
        id: 'v_aha',
        char: 'ಅಃ',
        name: 'Visarga',
        group: 'Modifiers (ಯೋಗವಾಹ)',
        translit: 'aha',
        soundLike: 'Aspirate breath "aha"',
        exampleKn: 'ದುಃಖ',
        exampleEn: 'Dukha (Sorrow)',
        listenText: 'ಅಃ'
      }
    ],

    consonants: [
      // Ka-varga (Velar)
      { id: 'c_ka',  char: 'ಕ', name: 'Ka',  group: 'Ka-group (ಕ-ವರ್ಗ)', translit: 'ka', soundLike: 'k in kite', exampleKn: 'ಕಾಗೆ', exampleEn: 'Kaage (Crow)', listenText: 'ಕ' },
      { id: 'c_kha', char: 'ಖ', name: 'Kha', group: 'Ka-group (ಕ-ವರ್ಗ)', translit: 'kha', soundLike: 'kh in khan (aspirated)', exampleKn: 'ಖಡ್ಗ', exampleEn: 'Khadga (Sword)', listenText: 'ಖ' },
      { id: 'c_ga',  char: 'ಗ', name: 'Ga',  group: 'Ka-group (ಕ-ವರ್ಗ)', translit: 'ga', soundLike: 'g in gate', exampleKn: 'ಗಂಟೆ', exampleEn: 'Gante (Bell / Hour)', listenText: 'ಗ' },
      { id: 'c_gha', char: 'ಘ', name: 'Gha', group: 'Ka-group (ಕ-ವರ್ಗ)', translit: 'gha', soundLike: 'gh in ghost (voiced aspirate)', exampleKn: 'ಘಂಟೆ', exampleEn: 'Ghaata (Occurrence)', listenText: 'ಘ' },
      { id: 'c_nga', char: 'ಙ', name: 'Nga', group: 'Ka-group (ಕ-ವರ್ಗ)', translit: 'nga', soundLike: 'ng in sing', exampleKn: 'ವಾಙ್ಮಯ', exampleEn: 'Vaanmaya (Literature)', listenText: 'ಙ' },

      // Cha-varga (Palatal)
      { id: 'c_cha',  char: 'ಚ', name: 'Cha',  group: 'Cha-group (ಚ-ವರ್ಗ)', translit: 'cha', soundLike: 'ch in chair', exampleKn: 'ಚಮಚ', exampleEn: 'Chamacha (Spoon)', listenText: 'ಚ' },
      { id: 'c_chha', char: 'ಛ', name: 'Chha', group: 'Cha-group (ಚ-ವರ್ಗ)', translit: 'chha', soundLike: 'chh in church-hill (aspirated)', exampleKn: 'ಛತ್ರಿ', exampleEn: 'Chhatri (Umbrella)', listenText: 'ಛ' },
      { id: 'c_ja',   char: 'ಜ', name: 'Ja',   group: 'Cha-group (ಚ-ವರ್ಗ)', translit: 'ja', soundLike: 'j in joy, jug', exampleKn: 'ಜನ', exampleEn: 'Jana (People)', listenText: 'ಜ' },
      { id: 'c_jha',  char: 'ಝ', name: 'Jha',  group: 'Cha-group (ಚ-ವರ್ಗ)', translit: 'jha', soundLike: 'jh in hedge-hog (aspirated)', exampleKn: 'ಝರಿ', exampleEn: 'Jhari (Stream)', listenText: 'ಝ' },
      { id: 'c_nya',  char: 'ಞ', name: 'Nya',  group: 'Cha-group (ಚ-ವರ್ಗ)', translit: 'nya', soundLike: 'ny in canyon', exampleKn: 'ಜ್ಞಾನ', exampleEn: 'Gnyaana (Knowledge)', listenText: 'ಞ' },

      // Ta-varga (Retroflex)
      { id: 'c_tta',  char: 'ಟ', name: 'Ta',   group: 'Ta-group (ಟ-ವರ್ಗ)', translit: 'ta / ṭa', soundLike: 'Hard retroflex t in time (curled tongue)', exampleKn: 'ಟೊಮ್ಯಾಟೊ', exampleEn: 'Tomato', listenText: 'ಟ' },
      { id: 'c_ttha', char: 'ಠ', name: 'Tha',  group: 'Ta-group (ಟ-ವರ್ಗ)', translit: 'tha / ṭha', soundLike: 'Hard aspirated th in lighthouse', exampleKn: 'ಠಾಣೆ', exampleEn: 'Thaane (Station)', listenText: 'ಠ' },
      { id: 'c_dda',  char: 'ಡ', name: 'Da',   group: 'Ta-group (ಟ-ವರ್ಗ)', translit: 'da / ḍa', soundLike: 'Hard retroflex d in door', exampleKn: 'ಡಬ್ಬ', exampleEn: 'Dabba (Box)', listenText: 'ಡ' },
      { id: 'c_ddha', char: 'ಢ', name: 'Dha',  group: 'Ta-group (ಟ-ವರ್ಗ)', translit: 'dha / ḍha', soundLike: 'Hard aspirated dh in red-hot', exampleKn: 'ಢಕ್ಕೆ', exampleEn: 'Dhakke (Small drum)', listenText: 'ಢ' },
      { id: 'c_nna',  char: 'ಣ', name: 'Na',   group: 'Ta-group (ಟ-ವರ್ಗ)', translit: 'na / ṇa', soundLike: 'Retroflex n (curled tongue)', exampleKn: 'ಹಣ', exampleEn: 'Hana (Money)', listenText: 'ಣ' },

      // Tha-varga (Dental)
      { id: 'c_ta',  char: 'ತ', name: 'Ta (Soft)',  group: 'Ta-dental (ತ-ವರ್ಗ)', translit: 'ta', soundLike: 'Soft dental th in think, thermal', exampleKn: 'ತಲೆ', exampleEn: 'Tale (Head)', listenText: 'ತ' },
      { id: 'c_tha', char: 'ಥ', name: 'Tha (Soft)', group: 'Ta-dental (ತ-ವರ್ಗ)', translit: 'tha', soundLike: 'Soft aspirated th in thanks', exampleKn: 'ರಥ', exampleEn: 'Ratha (Chariot)', listenText: 'ಥ' },
      { id: 'c_da',  char: 'ದ', name: 'Da (Soft)',  group: 'Ta-dental (ತ-ವರ್ಗ)', translit: 'da', soundLike: 'Soft dental th in the, this', exampleKn: 'ದಾರಿ', exampleEn: 'Daari (Way / Path)', listenText: 'ದ' },
      { id: 'c_dha', char: 'ಧ', name: 'Dha (Soft)', group: 'Ta-dental (ತ-ವರ್ಗ)', translit: 'dha', soundLike: 'Soft aspirated dh in breathe-hard', exampleKn: 'ಧನ', exampleEn: 'Dhana (Wealth)', listenText: 'ಧ' },
      { id: 'c_na',  char: 'ನ', name: 'Na (Soft)',  group: 'Ta-dental (ತ-ವರ್ಗ)', translit: 'na', soundLike: 'n in net, name', exampleKn: 'ನಮಸ್ಕಾರ', exampleEn: 'Namaskāra (Hello)', listenText: 'ನ' },

      // Pa-varga (Labial)
      { id: 'c_pa',  char: 'ಪ', name: 'Pa',  group: 'Pa-group (ಪ-ವರ್ಗ)', translit: 'pa', soundLike: 'p in pen, post', exampleKn: 'ಪೇಟೆ', exampleEn: 'Pete (Market town)', listenText: 'ಪ' },
      { id: 'c_pha', char: 'ಫ', name: 'Pha / Fa', group: 'Pa-group (ಪ-ವರ್ಗ)', translit: 'pha / fa', soundLike: 'ph in photo / phone', exampleKn: 'ಫಲ', exampleEn: 'Phala (Fruit / Result)', listenText: 'ಫ' },
      { id: 'c_ba',  char: 'ಬ', name: 'Ba',  group: 'Pa-group (ಪ-ವರ್ಗ)', translit: 'ba', soundLike: 'b in book, bus', exampleKn: 'ಬೆಳ್ಳಿ', exampleEn: 'Belli (Silver)', listenText: 'ಬ' },
      { id: 'c_bha', char: 'ಭ', name: 'Bha', group: 'Pa-group (ಪ-ವರ್ಗ)', translit: 'bha', soundLike: 'bh in abhor (aspirated b)', exampleKn: 'ಭಾರತ', exampleEn: 'Bhaaratha (India)', listenText: 'ಭ' },
      { id: 'c_ma',  char: 'ಮ', name: 'Ma',  group: 'Pa-group (ಪ-ವರ್ಗ)', translit: 'ma', soundLike: 'm in milk, mother', exampleKn: 'ಮನೆ', exampleEn: 'Mane (Home)', listenText: 'ಮ' },

      // Unstructured Consonants (ಅವರ್ಗೀಯ)
      { id: 'c_ya',  char: 'ಯ', name: 'Ya',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'ya', soundLike: 'y in yellow, yes', exampleKn: 'ಯುಗ', exampleEn: 'Yuga (Era)', listenText: 'ಯ' },
      { id: 'c_ra',  char: 'ರ', name: 'Ra',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'ra', soundLike: 'r in rain, road', exampleKn: 'ರಸ್ತೆ', exampleEn: 'Raste (Road)', listenText: 'ರ' },
      { id: 'c_la',  char: 'ಲ', name: 'La',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'la', soundLike: 'l in light, leaf', exampleKn: 'ಲಾಭ', exampleEn: 'Laabha (Profit)', listenText: 'ಲ' },
      { id: 'c_va',  char: 'ವ', name: 'Va',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'va', soundLike: 'v/w in water, vine', exampleKn: 'ವಸ್ತು', exampleEn: 'Vastu (Object)', listenText: 'ವ' },
      { id: 'c_sha', char: 'ಶ', name: 'Sha (Palatal)', group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'sha / śa', soundLike: 'sh in shine, shoe', exampleKn: 'ಶಾಂತಿ', exampleEn: 'Shaanthi (Peace)', listenText: 'ಶ' },
      { id: 'c_ssha',char: 'ಷ', name: 'Sha (Retroflex)', group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'sha / ṣa', soundLike: 'sh with curled tongue', exampleKn: 'ಷಣ್ಮುಖ', exampleEn: 'Shanmukha', listenText: 'ಷ' },
      { id: 'c_sa',  char: 'ಸ', name: 'Sa',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'sa', soundLike: 's in sun, simple', exampleKn: 'ಸಮಯ', exampleEn: 'Samaya (Time)', listenText: 'ಸ' },
      { id: 'c_ha',  char: 'ಹ', name: 'Ha',  group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'ha', soundLike: 'h in home, hope', exampleKn: 'ಹೂವು', exampleEn: 'Hoovu (Flower)', listenText: 'ಹ' },
      { id: 'c_lla', char: 'ಳ', name: 'La (Retroflex)', group: 'Other Consonants (ಅವರ್ಗೀಯ)', translit: 'la / ḷa', soundLike: 'Deep retroflex l (curled tongue)', exampleKn: 'ಬೆಳಕು', exampleEn: 'Belaku (Light)', listenText: 'ಳ' }
    ]
  },

  // ==========================================================================
  // 2. WORDS — HIGH-UTILITY EVERYDAY VOCABULARY
  // ==========================================================================
  words: [
    // Greetings & Basics
    {
      id: 'w_namaskara',
      kannada: 'ನಮಸ್ಕಾರ',
      translit: 'Namaskāra',
      english: 'Hello / Greetings',
      category: 'greetings',
      note: 'Universal polite greeting with folded hands across Bengaluru.',
      listenText: 'ನಮಸ್ಕಾರ'
    },
    {
      id: 'w_dhanyavada',
      kannada: 'ಧನ್ಯವಾದ',
      translit: 'Dhanyavāda',
      english: 'Thank you',
      category: 'greetings',
      note: 'Formal thank you. You can also hear "Tumba thanks" casually.',
      listenText: 'ಧನ್ಯವಾದ'
    },
    {
      id: 'w_haudu',
      kannada: 'ಹೌದು',
      translit: 'Haudu',
      english: 'Yes',
      category: 'greetings',
      note: 'Common affirmation. In conversation often pronounced "Hao".',
      listenText: 'ಹೌದು'
    },
    {
      id: 'w_illa',
      kannada: 'ಇಲ್ಲ',
      translit: 'Illa',
      english: 'No / Not available',
      category: 'greetings',
      note: 'Very versatile: means "no", "not there", or "we don\'t have it".',
      listenText: 'ಇಲ್ಲ'
    },
    {
      id: 'w_dayavittu',
      kannada: 'ದಯವಿಟ್ಟು',
      translit: 'Dayavittu',
      english: 'Please',
      category: 'greetings',
      note: 'Adds warmth and politeness to any request.',
      listenText: 'ದಯವಿಟ್ಟು'
    },
    {
      id: 'w_kshamisi',
      kannada: 'ಕ್ಷಮಿಸಿ',
      translit: 'Kshamisi',
      english: 'Sorry / Excuse me',
      category: 'greetings',
      note: 'Use to get someone\'s attention politely or apologize.',
      listenText: 'ಕ್ಷಮಿಸಿ'
    },
    {
      id: 'w_chennagi',
      kannada: 'ಚೆನ್ನಾಗಿದೆ',
      translit: 'Chennāgide',
      english: 'It is good / Nice',
      category: 'greetings',
      note: 'Compliment food, weather, or an experience in Bengaluru.',
      listenText: 'ಚೆನ್ನಾಗಿದೆ'
    },

    // Numbers & Money
    {
      id: 'w_ondu',
      kannada: 'ಒಂದು',
      translit: 'Ondu',
      english: 'One (1)',
      category: 'numbers',
      note: 'Often used when ordering: "Ondu coffee kodi" (Give one coffee).',
      listenText: 'ಒಂದು'
    },
    {
      id: 'w_eradu',
      kannada: 'ಎರಡು',
      translit: 'Eradu',
      english: 'Two (2)',
      category: 'numbers',
      note: '"Eradu dose kodi" = Give two dosas.',
      listenText: 'ಎರಡು'
    },
    {
      id: 'w_mooru',
      kannada: 'ಮೂರು',
      translit: 'Mooru',
      english: 'Three (3)',
      category: 'numbers',
      note: 'Essential counting word.',
      listenText: 'ಮೂರು'
    },
    {
      id: 'w_naalku',
      kannada: 'ನಾಲ್ಕು',
      translit: 'Nālku',
      english: 'Four (4)',
      category: 'numbers',
      note: 'Often used for quantities.',
      listenText: 'ನಾಲ್ಕು'
    },
    {
      id: 'w_aidu',
      kannada: 'ಐದು',
      translit: 'Aidu',
      english: 'Five (5)',
      category: 'numbers',
      note: 'Common currency denomination.',
      listenText: 'ಐದು'
    },
    {
      id: 'w_hattu',
      kannada: 'ಹತ್ತು',
      translit: 'Hattu',
      english: 'Ten (10)',
      category: 'numbers',
      note: 'Base number for tens in Kannada.',
      listenText: 'ಹತ್ತು'
    },
    {
      id: 'w_nooru',
      kannada: 'ನೂರು',
      translit: 'Nooru',
      english: 'Hundred (100)',
      category: 'numbers',
      note: 'Nammooru literally means "Our Hundred / Our Town" (Namma Ooru).',
      listenText: 'ನೂರು'
    },
    {
      id: 'w_saavira',
      kannada: 'ಸಾವಿರ',
      translit: 'Sāvira',
      english: 'Thousand (1,000)',
      category: 'numbers',
      note: 'Used for larger transactions and rent figures.',
      listenText: 'ಸಾವಿರ'
    },
    {
      id: 'w_roopaayi',
      kannada: 'ರೂಪಾಯಿ',
      translit: 'Roopāyi',
      english: 'Rupees',
      category: 'numbers',
      note: '"Hattu roopaayi" = 10 rupees.',
      listenText: 'ರೂಪಾಯಿ'
    },
    {
      id: 'w_eshtu',
      kannada: 'ಎಷ್ಟು',
      translit: 'Eshtu',
      english: 'How much / How many?',
      category: 'numbers',
      note: 'The most important price question in Bengaluru markets.',
      listenText: 'ಎಷ್ಟು'
    },

    // Food & Dining
    {
      id: 'w_oota',
      kannada: 'ಊಟ',
      translit: 'Oota',
      english: 'Meal / Lunch or Dinner',
      category: 'food',
      note: '"Oota aayitha?" (Did you have food?) is Bengaluru\'s sign of care.',
      listenText: 'ಊಟ'
    },
    {
      id: 'w_tindi',
      kannada: 'ತಿಂಡಿ',
      translit: 'Tindi',
      english: 'Breakfast / Snack',
      category: 'food',
      note: 'Refers to South Indian breakfast items like idli, vada, and dosa.',
      listenText: 'ತಿಂಡಿ'
    },
    {
      id: 'w_neeru',
      kannada: 'ನೀರು',
      translit: 'Neeru',
      english: 'Water',
      category: 'food',
      note: '"Kudiyodu neeru" = Drinking water.',
      listenText: 'ನೀರು'
    },
    {
      id: 'w_kaafi',
      kannada: 'ಕಾಫಿ',
      translit: 'Kāfi',
      english: 'Filter Coffee',
      category: 'food',
      note: 'Bengaluru\'s beloved traditional beverage served in a dabara-tumbler.',
      listenText: 'ಕಾಫಿ'
    },
    {
      id: 'w_chaha',
      kannada: 'ಚಹಾ / ಟೀ',
      translit: 'Chahā / Tee',
      english: 'Tea',
      category: 'food',
      note: 'Hot brewed tea available at roadside stalls across every cross road.',
      listenText: 'ಚಹಾ'
    },
    {
      id: 'w_bisi',
      kannada: 'ಬಿಸಿ',
      translit: 'Bisi',
      english: 'Hot / Fresh',
      category: 'food',
      note: '"Bisi bisi bele bhaath" = Piping hot lentil rice!',
      listenText: 'ಬಿಸಿ'
    },
    {
      id: 'w_baeku',
      kannada: 'ಬೇಕು',
      translit: 'Baeku',
      english: 'I want / Needed',
      category: 'food',
      note: 'Use to state what you need: "Coffee baeku" (I want coffee).',
      listenText: 'ಬೇಕು'
    },
    {
      id: 'w_baeda',
      kannada: 'ಬೇಡ',
      translit: 'Baeda',
      english: 'Don\'t want / No thanks',
      category: 'food',
      note: 'Polite refusal: "Khaara baeda" (No spice, please).',
      listenText: 'ಬೇಡ'
    },

    // Transport & Travel
    {
      id: 'w_auto',
      kannada: 'ಆಟೋ',
      translit: 'Aatō',
      english: 'Auto-rickshaw',
      category: 'transport',
      note: 'The iconic green-and-yellow three-wheelers of Bengaluru streets.',
      listenText: 'ಆಟೋ'
    },
    {
      id: 'w_nildaana',
      kannada: 'ನಿಲ್ದಾಣ',
      translit: 'Nildāna',
      english: 'Stop / Station',
      category: 'transport',
      note: '"Bus nildaana" = Bus stop; "Railway nildaana" = Train station.',
      listenText: 'ನಿಲ್ದಾಣ'
    },
    {
      id: 'w_raste',
      kannada: 'ರಸ್ತೆ',
      translit: 'Raste',
      english: 'Road / Street',
      category: 'transport',
      note: 'You will see this on every signboard (e.g., MG Raste).',
      listenText: 'ರಸ್ತೆ'
    },
    {
      id: 'w_illi',
      kannada: 'ಇಲ್ಲಿ',
      translit: 'Illi',
      english: 'Here',
      category: 'transport',
      note: '"Illi nillisi" = Stop right here.',
      listenText: 'ಇಲ್ಲಿ'
    },
    {
      id: 'w_alli',
      kannada: 'ಅಲ್ಲಿ',
      translit: 'Alli',
      english: 'There',
      category: 'transport',
      note: '"Alli hogona" = Let\'s go there.',
      listenText: 'ಅಲ್ಲಿ'
    },
    {
      id: 'w_hogi',
      kannada: 'ಹೋಗಿ',
      translit: 'Hōgi',
      english: 'Go (respectful)',
      category: 'transport',
      note: '"Munde hogi" = Go straight ahead.',
      listenText: 'ಹೋಗಿ'
    },
    {
      id: 'w_banni',
      kannada: 'ಬನ್ನಿ',
      translit: 'Banni',
      english: 'Come (respectful)',
      category: 'transport',
      note: 'Warm welcome: "Banni, koothukolli" (Please come, sit down).',
      listenText: 'ಬನ್ನಿ'
    },

    // Directions & Places
    {
      id: 'w_eda',
      kannada: 'ಎಡ / ಎಡಗಡೆ',
      translit: 'Eda / Edagade',
      english: 'Left / Left side',
      category: 'directions',
      note: '"Edakke thirugi" = Turn to the left.',
      listenText: 'ಎಡಗಡೆ'
    },
    {
      id: 'w_bala',
      kannada: 'ಬಲ / ಬಲಗಡೆ',
      translit: 'Bala / Balagade',
      english: 'Right / Right side',
      category: 'directions',
      note: '"Balakke thirugi" = Turn to the right.',
      listenText: 'ಬಲಗಡೆ'
    },
    {
      id: 'w_neera',
      kannada: 'ನೇರ / ಸೀದಾ',
      translit: 'Naera / Seedhā',
      english: 'Straight',
      category: 'directions',
      note: '"Seedha hogi" = Go straight ahead without turning.',
      listenText: 'ನೇರ'
    },
    {
      id: 'w_hatthira',
      kannada: 'ಹತ್ತಿರ',
      translit: 'Hatthira',
      english: 'Near / Close by',
      category: 'directions',
      note: '"Metro station hatthira ide" = Metro station is nearby.',
      listenText: 'ಹತ್ತಿರ'
    },
    {
      id: 'w_doora',
      kannada: 'ದೂರ',
      translit: 'Doora',
      english: 'Far away',
      category: 'directions',
      note: '"Tumba doora ide" = It is very far away.',
      listenText: 'ದೂರ'
    },
    {
      id: 'w_mane',
      kannada: 'ಮನೆ',
      translit: 'Mane',
      english: 'House / Home',
      category: 'directions',
      note: '"Namma mane" = Our home.',
      listenText: 'ಮನೆ'
    },
    {
      id: 'w_angadi',
      kannada: 'ಅಂಗಡಿ',
      translit: 'Angadi',
      english: 'Shop / Store',
      category: 'directions',
      note: '"Tarakari angadi" = Vegetable shop.',
      listenText: 'ಅಂಗಡಿ'
    },

    // Shopping & Markets
    {
      id: 'w_bele',
      kannada: 'ಬೆಲೆ',
      translit: 'Bele',
      english: 'Price / Cost',
      category: 'shopping',
      note: '"Idara bele eshtu?" = What is the price of this?',
      listenText: 'ಬೆಲೆ'
    },
    {
      id: 'w_kadime',
      kannada: 'ಕಡಿಮೆ',
      translit: 'Kadime',
      english: 'Less / Reduce',
      category: 'shopping',
      note: '"Svalpa kadime maadi" = Please reduce the price a little.',
      listenText: 'ಕಡಿಮೆ'
    },
    {
      id: 'w_jaasthi',
      kannada: 'ಜಾಸ್ತಿ',
      translit: 'Jāsthi',
      english: 'More / Too much',
      category: 'shopping',
      note: '"Bele tumba jaasthi" = The price is too high.',
      listenText: 'ಜಾಸ್ತಿ'
    },
    {
      id: 'w_kodi',
      kannada: 'ಕೊಡಿ',
      translit: 'Kodi',
      english: 'Give (polite)',
      category: 'shopping',
      note: '"Ondu kilo eerulli kodi" = Please give one kilo onions.',
      listenText: 'ಕೊಡಿ'
    },
    {
      id: 'w_chillare',
      kannada: 'ಚಿಲ್ಲರೆ',
      translit: 'Chillare',
      english: 'Small change / Coins',
      category: 'shopping',
      note: '"Chillare ideya?" = Do you have change for this note?',
      listenText: 'ಚಿಲ್ಲರೆ'
    },
    {
      id: 'w_thaaja',
      kannada: 'ತಾಜಾ',
      translit: 'Thājā',
      english: 'Fresh',
      category: 'shopping',
      note: 'Common in vegetable and flower markets like Gandhi Bazaar.',
      listenText: 'ತಾಜಾ'
    },

    // Everyday Life & Time
    {
      id: 'w_ivatthu',
      kannada: 'ಇವತ್ತು',
      translit: 'Ivatthu',
      english: 'Today',
      category: 'everyday',
      note: '"Ivatthu ranga shankara hogona" = Let\'s go to Ranga Shankara today.',
      listenText: 'ಇವತ್ತು'
    },
    {
      id: 'w_naale',
      kannada: 'ನಾಳೆ',
      translit: 'Nāle',
      english: 'Tomorrow',
      category: 'everyday',
      note: '"Naale sigona" = Let\'s meet tomorrow.',
      listenText: 'ನಾಳೆ'
    },
    {
      id: 'w_eega',
      kannada: 'ಈಗ',
      translit: 'Eega',
      english: 'Now',
      category: 'everyday',
      note: '"Eega barthini" = I will come right now.',
      listenText: 'ಈಗ'
    },
    {
      id: 'w_samaya',
      kannada: 'ಸಮಯ / ಹೊತ್ತು',
      translit: 'Samaya',
      english: 'Time',
      category: 'everyday',
      note: '"Samaya eshtu aayithu?" = What time is it now?',
      listenText: 'ಸಮಯ'
    },
    {
      id: 'w_gotthu',
      kannada: 'ಗೊತ್ತು',
      translit: 'Gotthu',
      english: 'I know / Understood',
      category: 'everyday',
      note: '"Nanage gotthu" = I know; "Gotthilla" = I don\'t know.',
      listenText: 'ಗೊತ್ತು'
    },
    {
      id: 'w_svalpa',
      kannada: 'ಸ್ವಲ್ಪ',
      translit: 'Svalpa',
      english: 'A little bit',
      category: 'everyday',
      note: 'One of Bengaluru\'s most famous words: "Svalpa adjust maadi"!',
      listenText: 'ಸ್ವಲ್ಪ'
    }
  ],

  // ==========================================================================
  // 3. PHRASES — REAL-WORLD CONVERSATIONS FOR BENGALURU
  // ==========================================================================
  phrases: [
    // Auto-Rickshaw & Commute
    {
      id: 'p_meter_haaki',
      kannada: 'ಮೀಟರ್ ಹಾಕಿ ಬನ್ನಿ ಸರ್',
      translit: 'Meter haaki banni sir',
      english: 'Please turn on the meter, sir',
      category: 'auto',
      usage: 'Polite but firm request when boarding an auto at a stand.',
      listenText: 'ಮೀಟರ್ ಹಾಕಿ ಬನ್ನಿ ಸರ್'
    },
    {
      id: 'p_illi_nillisi',
      kannada: 'ದಯವಿಟ್ಟು ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ',
      translit: 'Dayavittu illi nillisi',
      english: 'Please stop right here',
      category: 'auto',
      usage: 'Tell the auto driver or bus conductor where to let you down.',
      listenText: 'ದಯವಿಟ್ಟು ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ'
    },
    {
      id: 'p_indiranagar_hogteera',
      kannada: 'ಇಂದಿರಾನಗರಕ್ಕೆ ಹೋಗ್ತೀರಾ?',
      translit: 'Indiranagar-akkey hogtheera?',
      english: 'Will you go to Indiranagar?',
      category: 'auto',
      usage: 'Ask the driver if they are willing to take your destination.',
      listenText: 'ಇಂದಿರಾನಗರಕ್ಕೆ ಹೋಗ್ತೀರಾ?'
    },
    {
      id: 'p_eshtu_aagutthe',
      kannada: 'ಇಲ್ಲಿಂದ ಎಷ್ಟು ಆಗುತ್ತೆ?',
      translit: 'Illinda eshtu aagutthe?',
      english: 'How much will it be from here?',
      category: 'auto',
      usage: 'Ask the fare beforehand when the meter is not in use.',
      listenText: 'ಇಲ್ಲಿಂದ ಎಷ್ಟು ಆಗುತ್ತೆ?'
    },
    {
      id: 'p_seedha_hogi',
      kannada: 'ಮುಂದೆ ಹೋಗಿ, ಎಡಕ್ಕೆ ತಿರುಗಿ',
      translit: 'Munde hogi, edakke thirugi',
      english: 'Go straight ahead, then turn left',
      category: 'auto',
      usage: 'Giving turn-by-turn directions to reach your building.',
      listenText: 'ಮುಂದೆ ಹೋಗಿ, ಎಡಕ್ಕೆ ತಿರುಗಿ'
    },

    // Food & Ordering
    {
      id: 'p_dose_kodi',
      kannada: 'ಒಂದು ಮಸಾಲ ದೋಸೆ ಮತ್ತು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ',
      translit: 'Ondu masala dose matthu filter kaafi kodi',
      english: 'Please give one masala dosa and a filter coffee',
      category: 'food',
      usage: 'Ordering at iconic darshinis (Vidyarthi Bhavan, CTR, Taaza Thindi).',
      listenText: 'ಒಂದು ಮಸಾಲ ದೋಸೆ ಮತ್ತು ಫಿಲ್ಟರ್ ಕಾಫಿ ಕೊಡಿ'
    },
    {
      id: 'p_khaara_kadime',
      kannada: 'ಸ್ವಲ್ಪ ಖಾರ ಕಡಿಮೆ ಮಾಡಿ',
      translit: 'Svalpa khaara kadime maadi',
      english: 'Please make it a little less spicy',
      category: 'food',
      usage: 'Useful instruction when placing your order with the chef.',
      listenText: 'ಸ್ವಲ್ಪ ಖಾರ ಕಡಿಮೆ ಮಾಡಿ'
    },
    {
      id: 'p_bisi_neeru',
      kannada: 'ಕುಡಿಯಲು ಬಿಸಿ ನೀರು ಸಿಗುತ್ತಾ?',
      translit: 'Kudiyalu bisi neeru sigutthaa?',
      english: 'Can I get warm drinking water?',
      category: 'food',
      usage: 'Polite request at breakfast cafes and lunch homes.',
      listenText: 'ಕುಡಿಯಲು ಬಿಸಿ ನೀರು ಸಿಗುತ್ತಾ?'
    },
    {
      id: 'p_bill_eshtu',
      kannada: 'ಬಿಲ್ ಎಷ್ಟು ಆಯಿತು?',
      translit: 'Bill eshtu aayithu?',
      english: 'How much is the bill?',
      category: 'food',
      usage: 'Asking the cashier or waiter at the end of a meal.',
      listenText: 'ಬಿಲ್ ಎಷ್ಟು ಆಯಿತು?'
    },
    {
      id: 'p_oota_chennagittu',
      kannada: 'ಊಟ ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು, ಧನ್ಯವಾದ!',
      translit: 'Oota tumba chennaagittu, dhanyavāda!',
      english: 'The food was wonderful, thank you!',
      category: 'food',
      usage: 'Warm compliment to the cook or host.',
      listenText: 'ಊಟ ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು, ಧನ್ಯವಾದ!'
    },

    // Shopping & Bargaining Politely
    {
      id: 'p_idara_bele',
      kannada: 'ಇದರ ಬೆಲೆ ಎಷ್ಟು?',
      translit: 'Idara bele eshtu?',
      english: 'How much does this cost?',
      category: 'shopping',
      usage: 'Pointing to any item in a local vegetable or flower stall.',
      listenText: 'ಇದರ ಬೆಲೆ ಎಷ್ಟು?'
    },
    {
      id: 'p_kadime_maadtheera',
      kannada: 'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡ್ತೀರಾ?',
      translit: 'Svalpa kadime maadtheera?',
      english: 'Could you reduce the price a little bit?',
      category: 'shopping',
      usage: 'Polite, respectful negotiation that vendors appreciate.',
      listenText: 'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡ್ತೀರಾ?'
    },
    {
      id: 'p_chillare_ideya',
      kannada: 'ಐನೂರು ರೂಪಾಯಿಗೆ ಚಿಲ್ಲರೆ ಇದೆಯಾ?',
      translit: 'Ainooru roopaayige chillare ideya?',
      english: 'Do you have change for five hundred rupees?',
      category: 'shopping',
      usage: 'Ask before paying with a large bank note.',
      listenText: 'ಐನೂರು ರೂಪಾಯಿಗೆ ಚಿಲ್ಲರೆ ಇದೆಯಾ?'
    },
    {
      id: 'p_ondu_kilo_kodi',
      kannada: 'ಒಂದು ಕಿಲೋ ತಾಜಾ ಟೊಮ್ಯಾಟೊ ಕೊಡಿ',
      translit: 'Ondu kilo thaaja tomato kodi',
      english: 'Please give one kilo of fresh tomatoes',
      category: 'shopping',
      usage: 'Buying produce at Russell Market or street vendors.',
      listenText: 'ಒಂದು ಕಿಲೋ ತಾಜಾ ಟೊಮ್ಯಾಟೊ ಕೊಡಿ'
    },
    {
      id: 'p_upi_ideya',
      kannada: 'ಇಲ್ಲಿ ಯುಪಿಐ / ಗೂಗಲ್ ಪೇ ಇದೆಯಾ?',
      translit: 'Illi UPI / Google Pay ideya?',
      english: 'Do you accept UPI / Google Pay here?',
      category: 'shopping',
      usage: 'Every tea stall and shop in Bengaluru has a QR code scanner.',
      listenText: 'ಇಲ್ಲಿ ಯುಪಿಐ ಗೂಗಲ್ ಪೇ ಇದೆಯಾ?'
    },

    // Politeness & Everyday Conversations
    {
      id: 'p_nidhaanavaagi',
      kannada: 'ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ',
      translit: 'Svalpa nidhaanavaagi maathanaadi',
      english: 'Please speak a little slowly',
      category: 'polite',
      usage: 'Essential phrase when locals speak faster than you can follow.',
      listenText: 'ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ'
    },
    {
      id: 'p_kannada_kalithiddene',
      kannada: 'ನಾನು ಕನ್ನಡ ಕಲೀತಾ ಇದ್ದೀನಿ',
      translit: 'Naanu Kannada kaleethaa iddeeni',
      english: 'I am currently learning Kannada',
      category: 'polite',
      usage: 'Always brings an immediate warm smile from Bengaluru residents.',
      listenText: 'ನಾನು ಕನ್ನಡ ಕಲೀತಾ ಇದ್ದೀನಿ'
    },
    {
      id: 'p_svalpa_barutthe',
      kannada: 'ನನಗೆ ಕನ್ನಡ ಸ್ವಲ್ಪ ಬರುತ್ತೆ',
      translit: 'Nanage Kannada svalpa barutthe',
      english: 'I know a little bit of Kannada',
      category: 'polite',
      usage: 'Helps set expectations gently when starting a conversation.',
      listenText: 'ನನಗೆ ಕನ್ನಡ ಸ್ವಲ್ಪ ಬರುತ್ತೆ'
    },
    {
      id: 'p_matthomme_heli',
      kannada: 'ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ',
      translit: 'Dayavittu matthomme heli',
      english: 'Please say that once again',
      category: 'polite',
      usage: 'When you didn\'t catch what was said the first time.',
      listenText: 'ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ'
    },
    {
      id: 'p_enanthaare',
      kannada: 'ಇದಕ್ಕೆ ಕನ್ನಡದಲ್ಲಿ ಏನಂತಾರೆ?',
      translit: 'Idakke Kannadadalli enanthaare?',
      english: 'What is this called in Kannada?',
      category: 'polite',
      usage: 'The ultimate learning question: point to an object and ask!',
      listenText: 'ಇದಕ್ಕೆ ಕನ್ನಡದಲ್ಲಿ ಏನಂತಾರೆ?'
    },
    {
      id: 'p_neevu_chennagiddeera',
      kannada: 'ನೀವು ಹೇಗಿದ್ದೀರಾ? ಚೆನ್ನಾಗಿದ್ದೀರಾ?',
      translit: 'Neevu haegiddeera? Chennaagiddeera?',
      english: 'How are you? Are you doing well?',
      category: 'daily',
      usage: 'Kind check-in with apartment guards, colleagues, and neighbors.',
      listenText: 'ನೀವು ಹೇಗಿದ್ದೀರಾ? ಚೆನ್ನಾಗಿದ್ದೀರಾ?'
    },
    {
      id: 'p_ivatthu_raathri',
      kannada: 'ನಾಳೆ ಬೆಳಗ್ಗೆ ಸಿಗೋಣ',
      translit: 'Nāle belagge sigōna',
      english: 'Let\'s meet tomorrow morning',
      category: 'daily',
      usage: 'Friendly farewell when wrapping up plans with friends.',
      listenText: 'ನಾಳೆ ಬೆಳಗ್ಗೆ ಸಿಗೋಣ'
    }
  ]
};
