/**
 * Liana Solar - Unified Site Data & Admin Manager
 * Handles:
 * 1. Theme Switcher Studio (Solar Orange, Royal Navy & Green Logo-Matched, Clean Eco)
 * 2. Branding & Logo Management (Crisp Typography vs Custom Image)
 * 3. Client Installation Photos Gallery (with Client Name, City, Capacity & Live Search)
 * 4. Technology & Equipment Ecosystem Partner Brands
 * 5. Contact Form Submissions & Leads Inbox
 * 6. Smooth Scroll Reveal Animations
 * 7. Hybrid Server Sync (data-api.php)
 */

const API_ENDPOINT = "data-api.php";

// =========================================================================
// 0. THEME SWITCHER STUDIO & SYSTEM
// =========================================================================
const THEME_STORAGE_KEY = "liana_solar_site_theme_v2";

const THEME_PRESETS = {
    solar_orange: {
        id: "solar_orange",
        name: "Solar Gold & Electric Orange",
        desc: "High-energy classic vibrant solar orange & sun gold highlights.",
        primary: "#f47629",
        primaryHover: "#d95e14",
        secondary: "#16a34a",
        accent: "#1e3a8a",
        gradient: "linear-gradient(135deg, #f47629 0%, #ff9f43 100%)",
        badgeBg: "rgba(244, 118, 41, 0.12)",
        badgeColor: "#f47629"
    },
    logo_navy_green: {
        id: "logo_navy_green",
        name: "Royal Navy & Emerald Green (Brand Logo Matched)",
        desc: "Color-matched with Liana Solar logo — Deep Royal Navy (#1e3a8a) & Eco Green (#16a34a).",
        primary: "#1e3a8a",
        primaryHover: "#172554",
        secondary: "#16a34a",
        accent: "#f59e0b",
        gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        badgeBg: "rgba(30, 58, 138, 0.12)",
        badgeColor: "#1e3a8a"
    },
    eco_emerald: {
        id: "eco_emerald",
        name: "Clean Modern Eco Green & Sky Blue",
        desc: "Fresh sustainable nature green with bright sky blue accents.",
        primary: "#15803d",
        primaryHover: "#166534",
        secondary: "#0284c7",
        accent: "#eab308",
        gradient: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
        badgeBg: "rgba(21, 128, 61, 0.12)",
        badgeColor: "#15803d"
    }
};

const DEFAULT_SITE_THEME = "solar_orange";

function getSiteTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            if (THEME_PRESETS[stored]) return stored;
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "string" && THEME_PRESETS[parsed]) return parsed;
            if (parsed && typeof parsed === "object" && (parsed.id || parsed.primary)) return parsed.id || parsed;
        }
    } catch (e) {
        console.error("Error reading site theme:", e);
    }
    return DEFAULT_SITE_THEME;
}

function saveSiteTheme(themeInput) {
    let themeKey = "solar_orange";
    let themeObj = THEME_PRESETS.solar_orange;

    if (typeof themeInput === "string" && THEME_PRESETS[themeInput]) {
        themeKey = themeInput;
        themeObj = THEME_PRESETS[themeInput];
    } else if (typeof themeInput === "object" && themeInput !== null) {
        themeKey = themeInput.id || "custom";
        themeObj = themeInput;
    }

    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeKey));
    applySiteTheme();

    fetch(`${API_ENDPOINT}?action=save_theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeObj)
    }).catch(err => console.log("Server API theme sync:", err));

    return themeObj;
}

function applySiteTheme() {
    const themeRaw = getSiteTheme();
    const themeConfig = (typeof themeRaw === "string" && THEME_PRESETS[themeRaw]) ? THEME_PRESETS[themeRaw] : (THEME_PRESETS[DEFAULT_SITE_THEME]);
    
    let styleTag = document.getElementById("dynamicThemeStyles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "dynamicThemeStyles";
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
        :root {
            --theme-primary: ${themeConfig.primary || '#f47629'} !important;
            --theme-primary-hover: ${themeConfig.primaryHover || '#d95e14'} !important;
            --theme-secondary: ${themeConfig.secondary || '#16a34a'} !important;
            --theme-accent: ${themeConfig.accent || '#1e3a8a'} !important;
            --theme-gradient: ${themeConfig.gradient || 'linear-gradient(135deg, #f47629 0%, #ff9f43 100%)'} !important;
            --theme-badge-bg: ${themeConfig.badgeBg || 'rgba(244, 118, 41, 0.12)'} !important;
            --theme-badge-color: ${themeConfig.badgeColor || '#f47629'} !important;
        }

        /* 1. Global Headings, Bold Accents & Titles */
        h1 b, h2 b, h3 b, h4 b, h5 b, h6 b,
        .h1 b, .h2 b, .h3 b, .h4 b, .h5 b, .h6 b {
            color: var(--theme-primary) !important;
        }
        h3, h4, .color-alt {
            color: var(--theme-primary) !important;
        }
        h1 a:hover, h2 a:hover, h3 a:hover, h4 a:hover {
            color: var(--theme-primary) !important;
        }
        .highlight-accent, .theme-text, strong.highlight-text {
            color: var(--theme-primary) !important;
        }

        /* 2. Buttons & CTAs */
        .btn, .btn-primary, button.btn-adm, .btn.btn-lg, .btn.btn-sm, .btn-submit, input[type="submit"] {
            background-color: var(--theme-primary) !important;
            border-color: var(--theme-primary) !important;
            color: #ffffff !important;
        }
        .btn:hover, button.btn-adm:hover, .btn-primary:hover, .btn.btn-lg:hover, .btn.btn-sm:hover, .btn-submit:hover, input[type="submit"]:hover {
            background-color: var(--theme-primary-hover) !important;
            border-color: var(--theme-primary-hover) !important;
            color: #ffffff !important;
        }
        .btn .icon, .btn:hover .icon, .btn.active .icon, .btn:active .icon {
            color: #ffffff !important;
        }
        .btn-border {
            border: 2px solid var(--theme-primary) !important;
            color: var(--theme-primary) !important;
            background: transparent !important;
        }
        .btn-border:hover {
            background-color: var(--theme-primary) !important;
            border-color: var(--theme-primary) !important;
            color: #ffffff !important;
        }
        .btn-invert {
            background: #ffffff !important;
            color: #0f172a !important;
        }
        .btn-invert .icon {
            color: var(--theme-primary) !important;
        }
        .btn-invert:hover {
            background-color: var(--theme-primary) !important;
            color: #ffffff !important;
        }
        .btn-invert:hover .icon {
            color: #ffffff !important;
        }
        .btn-adm-outline {
            border-color: var(--theme-primary) !important;
            color: var(--theme-primary) !important;
        }
        .btn-adm-outline:hover {
            background: var(--theme-primary) !important;
            color: #ffffff !important;
        }

        /* 3. Navigation, Topbar & Header Links */
        .adm-topbar {
            border-bottom: 3px solid var(--theme-primary) !important;
        }
        .nav.navbar-nav > li.active > a .text,
        .nav.navbar-nav > li > a:hover .text,
        .navbar-nav li.active > a,
        .navbar-nav li > a:hover {
            color: var(--theme-primary) !important;
        }
        .navbar-nav .dropdown .dropdown-menu li > a:hover,
        .navbar-nav .dropdown .dropdown-menu li > a:focus {
            color: var(--theme-primary) !important;
        }
        header .phone .number .icon {
            color: var(--theme-primary) !important;
        }
        header .social-links ul li a:hover {
            color: var(--theme-primary) !important;
        }
        .electric-btn:hover, .electric-btn:hover .text {
            color: var(--theme-primary) !important;
        }

        /* 4. Markers, Icons, Lists & Blockquotes */
        .marker-list > li:after {
            color: var(--theme-primary) !important;
        }
        .category-list > li:after,
        .category-list > li a:hover {
            color: var(--theme-primary) !important;
        }
        .address-block .icon {
            color: var(--theme-primary) !important;
        }
        blockquote:before, blockquote .quote-author {
            color: var(--theme-primary) !important;
        }
        .tag, .tags-list li a {
            border-color: var(--theme-primary) !important;
            color: var(--theme-primary) !important;
        }
        .tag:hover, .tags-list li a:hover {
            background-color: var(--theme-primary) !important;
            border-color: var(--theme-primary) !important;
            color: #ffffff !important;
        }
        .calendar .selected, .calendar .selected:hover {
            background-color: var(--theme-primary) !important;
        }
        .social-links ul li a:hover {
            color: var(--theme-primary) !important;
        }

        /* 5. Slider, Hero & Marquee */
        .hero-nav-arrow:hover {
            background-color: var(--theme-primary) !important;
            color: #ffffff !important;
        }
        .hero-dot.active {
            background-color: var(--theme-primary) !important;
        }
        .preloader-sun-icon {
            color: var(--theme-primary) !important;
        }
        .preloader-solar-badge {
            box-shadow: 0 10px 25px var(--theme-badge-bg) !important;
        }
        .solar-pulse-ring {
            border-color: var(--theme-badge-bg) !important;
        }
        .eco-dot {
            background-color: var(--theme-primary) !important;
        }
        .back-to-top a:hover {
            background-color: var(--theme-primary) !important;
        }

        /* 6. Clients Page & Search */
        .client-card-badge {
            background: var(--theme-badge-bg) !important;
            color: var(--theme-primary) !important;
            border: 1px solid var(--theme-primary) !important;
        }
        .client-filter-pill.active {
            background: var(--theme-primary) !important;
            color: #ffffff !important;
            border-color: var(--theme-primary) !important;
        }
        .client-filter-pill:hover {
            border-color: var(--theme-primary) !important;
            color: var(--theme-primary) !important;
        }
        .client-search-input:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 4px var(--theme-badge-bg) !important;
        }

        /* 7. Admin Dashboard Elements */
        .adm-tab-btn.active, .adm-tab-btn:hover {
            color: var(--theme-primary) !important;
            border-bottom-color: var(--theme-primary) !important;
            background: var(--theme-badge-bg) !important;
        }
        .stat-icon.orange {
            color: var(--theme-primary) !important;
            background: var(--theme-badge-bg) !important;
        }
        .adm-input:focus {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 3px var(--theme-badge-bg) !important;
        }
        .theme-preset-card.active {
            border-color: var(--theme-primary) !important;
            box-shadow: 0 0 0 2px var(--theme-primary) !important;
        }
        .eco-brand-admin-card:hover {
            border-color: var(--theme-primary) !important;
        }
        .btn-adm-active {
            background: var(--theme-primary) !important;
            color: #ffffff !important;
        }

        /* 8. Pricing, Schemes, Bulb Blocks & Cards */
        .pricing-box:hover, .service-box:hover, .box:hover, .category-card:hover {
            border-color: var(--theme-primary) !important;
        }
        .star-pill, .rupee-star, .subsidy-badge {
            color: var(--theme-primary) !important;
        }
        .bulb-block:hover h5 b {
            color: var(--theme-primary) !important;
        }
    `;
}

// =========================================================================
// 1. SITE BRANDING & LOGO MANAGEMENT
// =========================================================================
const LOGO_STORAGE_KEY = "liana_solar_site_branding_v1";

const DEFAULT_SITE_LOGO = {
    mode: "default", // "default" (pure crisp HTML & tagline) or "image" (custom uploaded logo)
    imageUrl: "images/logo.jpeg",
    name: "Liana",
    sub: "Solar",
    tagline: "Powering a bright tomorrow",
    height: 95
};

function getSiteLogo() {
    try {
        const stored = localStorage.getItem(LOGO_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") return parsed;
        }
    } catch (e) {
        console.error("Error reading site logo:", e);
    }
    return DEFAULT_SITE_LOGO;
}

function saveSiteLogo(logoData) {
    localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(logoData));
    applySiteLogo();
    fetch(`${API_ENDPOINT}?action=save_logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logoData)
    }).catch(err => console.log("Server API logo sync:", err));
}

function resetSiteLogo() {
    saveSiteLogo(DEFAULT_SITE_LOGO);
    return DEFAULT_SITE_LOGO;
}

function applySiteLogo() {
    const config = getSiteLogo();
    const logoContainers = document.querySelectorAll(".page-header .logo > a, .page-footer .logo > a");
    
    logoContainers.forEach(container => {
        const isFooter = container.closest(".page-footer") !== null;
        if (config.mode === "image" && config.imageUrl) {
            container.innerHTML = `
                <img src="${config.imageUrl}" 
                     class="site-main-logo ${isFooter ? 'site-main-logo--footer' : ''}" 
                     alt="Liana Solar" 
                     style="height: ${config.height || (isFooter ? 75 : 95)}px; max-width: 360px; object-fit: contain; mix-blend-mode: multiply;">
            `;
        } else {
            // Default crisp typography with stylish high-contrast visible tagline
            container.innerHTML = `
                <img src="images/bolt.gif" class="logo-bolt" alt="Liana Solar">
                <span class="logo-words ${isFooter ? 'logo-words--invert' : ''}">
                    <span class="logo-brand-row">
                        <strong class="logo-name">${config.name || 'Liana'}</strong>
                        <span class="logo-sub">${config.sub || 'Solar'}</span>
                    </span>
                    <span class="logo-tagline">— ${config.tagline || 'Powering a bright tomorrow'} —</span>
                </span>
            `;
        }
    });
}

// =========================================================================
// 2. CLIENT PHOTOS & INSTALLATION PROJECTS MANAGEMENT
// =========================================================================
const DEFAULT_CLIENT_PHOTOS = [
    {
        id: "cp-1",
        name: "Rajesh Sharma",
        city: "Gomti Nagar, Lucknow",
        capacity: "5 kW On-Grid Rooftop",
        category: "residential",
        image: "images/solar/hero-rooftop-home.jpg",
        date: "2026-03-01"
    },
    {
        id: "cp-2",
        name: "Verma Cold Storage & Agro Plant",
        city: "Panki Industrial Area, Kanpur",
        capacity: "100 kW Commercial Plant",
        category: "commercial",
        image: "images/solar/rooftop-commercial.jpg",
        date: "2026-02-28"
    },
    {
        id: "cp-3",
        name: "Patel Agro Flour Mill (Atta Chakki)",
        city: "Barabanki",
        capacity: "15 HP Solar Atta Chakki",
        category: "agricultural",
        image: "images/solar/solar-atta-chakki.jpg",
        date: "2026-02-25"
    },
    {
        id: "cp-4",
        name: "Dr. S. K. Gupta Residence",
        city: "Indira Nagar, Lucknow",
        capacity: "3 kW PM Surya Ghar Rooftop",
        category: "residential",
        image: "images/solar/rooftop-residential.jpg",
        date: "2026-02-20"
    },
    {
        id: "cp-5",
        name: "Agrawal Textiles & Garments",
        city: "Unnao Industrial Corridor",
        capacity: "50 kW Hybrid System",
        category: "hybrid",
        image: "images/solar/hybrid-system.jpg",
        date: "2026-02-15"
    },
    {
        id: "cp-6",
        name: "Chaudhary Dairy & Agro Farmhouse",
        city: "Sitapur Highway, UP",
        capacity: "10 kW Off-Grid with Battery",
        category: "offgrid",
        image: "images/solar/off-grid-system.jpg",
        date: "2026-02-10"
    },
    {
        id: "cp-7",
        name: "Modern Public Senior Secondary School",
        city: "Faizabad Road, Lucknow",
        capacity: "25 kW Institutional Rooftop",
        category: "commercial",
        image: "images/gallery/gallery-img-01.jpg",
        date: "2026-02-05"
    },
    {
        id: "cp-8",
        name: "Siddhi Vinayak Hospital & Research Centre",
        city: "Alambagh, Lucknow",
        capacity: "30 kW Grid-Tied Solar Plant",
        category: "commercial",
        image: "images/gallery/gallery-img-02.jpg",
        date: "2026-01-28"
    },
    {
        id: "cp-9",
        name: "Mishra Rice Mill & Processing Unit",
        city: "Raebareli Road",
        capacity: "20 HP Solar Mill VFD Drive",
        category: "agricultural",
        image: "images/gallery/gallery-img-04.jpg",
        date: "2026-01-20"
    }
];

const PHOTOS_STORAGE_KEY = "liana_solar_client_photos_v3";

function getClientPhotos() {
    try {
        const stored = localStorage.getItem(PHOTOS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error("Error reading client photos:", e);
    }
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENT_PHOTOS));
    return DEFAULT_CLIENT_PHOTOS;
}

function saveClientPhotos(photos) {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
    fetch(`${API_ENDPOINT}?action=save_photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photos)
    }).then(res => res.json()).then(data => {
        if (data && data.data) {
            localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(data.data));
        }
    }).catch(err => console.log("Server API optional sync:", err));
}

function addClientPhotoWithDetails(data) {
    const current = getClientPhotos();
    const today = new Date().toISOString().split("T")[0];
    const newItem = {
        id: "cp-" + Date.now(),
        name: data.name || "Solar Installation Client",
        city: data.city || "Uttar Pradesh",
        capacity: data.capacity || "Rooftop Solar Plant",
        category: data.category || "residential",
        image: data.image || "images/solar/hero-rooftop-home.jpg",
        date: data.date || today
    };
    const updated = [newItem, ...current];
    saveClientPhotos(updated);
    return updated;
}

function addClientPhotos(imagesList) {
    const current = getClientPhotos();
    const today = new Date().toISOString().split("T")[0];
    const newItems = imagesList.map((imgBase64, idx) => ({
        id: "cp-" + Date.now() + "-" + idx,
        name: "Client Solar Site #" + (current.length + idx + 1),
        city: "Uttar Pradesh",
        capacity: "Solar Installation",
        category: "residential",
        image: imgBase64,
        date: today
    }));
    const updated = [...newItems, ...current];
    saveClientPhotos(updated);
    return updated;
}

function deleteClientPhoto(id) {
    let photos = getClientPhotos();
    photos = photos.filter(p => p.id !== id);
    saveClientPhotos(photos);
}

function resetClientPhotos() {
    saveClientPhotos(DEFAULT_CLIENT_PHOTOS);
    return DEFAULT_CLIENT_PHOTOS;
}


// =========================================================================
// 3. TECHNOLOGY & EQUIPMENT ECOSYSTEM MANAGEMENT
// =========================================================================
const DEFAULT_ECOSYSTEM_BRANDS = [
    { id: "eco-1", name: "DEYE", sub: "INVERTERS & STORAGE", logo: "images/brands/deye.svg" },
    { id: "eco-2", name: "SOLIS", sub: "SOLAR INVERTERS", logo: "images/brands/solis.svg" },
    { id: "eco-3", name: "INA SOLAR", sub: "TOGETHER WE SHINE", logo: "images/brands/ina-solar.svg" },
    { id: "eco-4", name: "LIVGUARD", sub: "ENERGY UNLIMITED", logo: "images/brands/livguard.svg" },
    { id: "eco-5", name: "LUMINOUS", sub: "SOLAR SOLUTIONS", logo: "images/brands/luminous.svg" },
    { id: "eco-6", name: "TATA POWER SOLAR", sub: "TIER-1 MODULES", logo: "images/brands/tata-solar.svg" },
    { id: "eco-7", name: "WAAREE", sub: "ONE WITH THE SUN", logo: "images/brands/waaree.svg" },
    { id: "eco-8", name: "GROWATT", sub: "SMART ENERGY", logo: "images/brands/growatt.svg" },
    { id: "eco-9", name: "HAVELLS", sub: "SOLAR & SWITCHGEAR", logo: "images/brands/havells.svg" },
    { id: "eco-10", name: "POLYCAB", sub: "SOLAR WIRES & CABLES", logo: "images/brands/polycab.svg" },
    { id: "eco-11", name: "SCHNEIDER", sub: "SURGE & PROTECTION", logo: "images/brands/schneider.svg" },
    { id: "eco-12", name: "ADANI SOLAR", sub: "TIER-1 MODULES", logo: "images/brands/adani-solar.svg" }
];

const ECOSYSTEM_STORAGE_KEY = "liana_solar_ecosystem_brands_v2";

function getEcosystemBrands() {
    try {
        const stored = localStorage.getItem(ECOSYSTEM_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error("Error reading ecosystem brands:", e);
    }
    localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(DEFAULT_ECOSYSTEM_BRANDS));
    return DEFAULT_ECOSYSTEM_BRANDS;
}

function saveEcosystemBrands(brands) {
    localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(brands));
    fetch(`${API_ENDPOINT}?action=save_ecosystem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brands)
    }).then(res => res.json()).then(data => {
        if (data && data.data) {
            localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(data.data));
        }
    }).catch(err => console.log("Server API optional sync:", err));
}

function addEcosystemBrand(brandData) {
    const brands = getEcosystemBrands();
    const newBrand = {
        id: "eco-" + Date.now(),
        name: brandData.name || "NEW BRAND",
        sub: brandData.sub || "SOLAR SOLUTIONS",
        icon: brandData.icon || "fa fa-sun-o",
        color: brandData.color || "#f47629",
        logo: brandData.logo || ""
    };
    brands.push(newBrand);
    saveEcosystemBrands(brands);
    return newBrand;
}

function deleteEcosystemBrand(id) {
    let brands = getEcosystemBrands();
    brands = brands.filter(b => b.id !== id);
    saveEcosystemBrands(brands);
}

function resetEcosystemBrands() {
    saveEcosystemBrands(DEFAULT_ECOSYSTEM_BRANDS);
    return DEFAULT_ECOSYSTEM_BRANDS;
}

// Render dynamic ecosystem track on website (e.g. index.html)
function renderWebsiteEcosystem(targetElementId = "ecosystemTrack") {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    const brands = getEcosystemBrands();
    if (brands.length === 0) return;

    const generateSetHtml = (set) => set.map(b => {
        let visualHtml = "";
        if (b.logo) {
            visualHtml = `<img src="${b.logo}" class="eco-brand-img" alt="${b.name}">`;
        } else if (b.icon) {
            visualHtml = `<i class="${b.icon}" style="color: ${b.color || '#f47629'}; margin-right: 6px;"></i><span>${b.name}</span>`;
        } else {
            visualHtml = `<span class="eco-dot" style="background: ${b.color || '#f47629'}; margin-right: 6px;"></span><span>${b.name}</span>`;
        }

        return `
            <div class="ecosystem-card">
                <div class="eco-brand-logo-wrap">
                    ${visualHtml}
                </div>
                <div class="eco-sub">${b.sub}</div>
            </div>
        `;
    }).join("");

    const singleSet = generateSetHtml(brands);
    container.innerHTML = singleSet + singleSet;
}


// =========================================================================
// 4. CONTACT SUBMISSIONS & LEADS INBOX MANAGEMENT
// =========================================================================
const DEFAULT_CONTACT_SUBMISSIONS = [
    {
        id: "sub-101",
        name: "Rajesh Sharma",
        phone: "9839012345",
        email: "rajesh.sharma@gmail.com",
        city: "Lucknow",
        systemType: "Residential Rooftop Solar (3 kW)",
        bill: "₹3,500 / month",
        message: "Interested in 3 kW rooftop solar with PM Surya Ghar subsidy for my 2-floor house in Gomti Nagar.",
        date: "2026-09-05",
        time: "18:45",
        status: "new"
    },
    {
        id: "sub-102",
        name: "Amit Patel",
        phone: "9415098765",
        email: "patelagro.mills@gmail.com",
        city: "Barabanki",
        systemType: "Solar Atta Chakki (15 HP)",
        bill: "₹28,000 / month diesel",
        message: "Need quote for 15 HP solar flour mill (atta chakki) with heavy VFD drive. Please call back tomorrow morning.",
        date: "2026-09-05",
        time: "14:20",
        status: "new"
    },
    {
        id: "sub-103",
        name: "Vikas Agrawal",
        phone: "9876543210",
        email: "vikas@agrawaltextiles.com",
        city: "Kanpur",
        systemType: "Commercial & Industrial (50 kW)",
        bill: "₹1,20,000 / month",
        message: "Looking for 50 kW on-grid solar plant installation for factory shed in Panki Industrial Area.",
        date: "2026-09-04",
        time: "11:15",
        status: "contacted"
    }
];

const SUBMISSIONS_STORAGE_KEY = "liana_solar_contact_submissions_v1";

function getContactSubmissions() {
    try {
        const stored = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error("Error reading submissions:", e);
    }
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(DEFAULT_CONTACT_SUBMISSIONS));
    return DEFAULT_CONTACT_SUBMISSIONS;
}

function saveContactSubmissions(submissions) {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    fetch(`${API_ENDPOINT}?action=save_leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissions)
    }).catch(err => console.log("Server API optional sync:", err));
}

function addContactSubmission(formData) {
    const list = getContactSubmissions();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSubmission = {
        id: "sub-" + Date.now(),
        name: formData.name || "Anonymous",
        phone: formData.phone || "",
        email: formData.email || "",
        city: formData.city || "Uttar Pradesh",
        systemType: formData.systemType || "Solar Inquiry",
        bill: formData.bill || "Not specified",
        message: formData.message || "Requested callback for solar consultation.",
        date: dateStr,
        time: timeStr,
        status: "new"
    };

    list.unshift(newSubmission);
    saveContactSubmissions(list);

    fetch(`${API_ENDPOINT}?action=submit_lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    }).catch(err => console.log(err));

    return newSubmission;
}

function updateSubmissionStatus(id, newStatus) {
    let list = getContactSubmissions();
    list = list.map(item => item.id === id ? { ...item, status: newStatus } : item);
    saveContactSubmissions(list);
    return list;
}

function deleteContactSubmission(id) {
    let list = getContactSubmissions();
    list = list.filter(item => item.id !== id);
    saveContactSubmissions(list);
}

function clearAllSubmissions() {
    saveContactSubmissions([]);
}

function getUnreadSubmissionsCount() {
    const list = getContactSubmissions();
    return list.filter(s => s.status === 'new').length;
}


// =========================================================================
// 5. FULL SITE BACKUP & RESTORE
// =========================================================================
function exportAllSiteDataJson() {
    const fullData = {
        meta: {
            appName: "Liana Solar Admin Database",
            exportedAt: new Date().toISOString(),
            version: "2.1"
        },
        siteTheme: getSiteTheme(),
        siteLogo: getSiteLogo(),
        contactSubmissions: getContactSubmissions(),
        ecosystemBrands: getEcosystemBrands(),
        clientPhotos: getClientPhotos()
    };
    return fullData;
}

function importSiteDataJson(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid backup data format");
    }
    if (jsonData.siteTheme) {
        saveSiteTheme(jsonData.siteTheme);
    }
    if (jsonData.siteLogo && typeof jsonData.siteLogo === 'object') {
        saveSiteLogo(jsonData.siteLogo);
    }
    if (Array.isArray(jsonData.contactSubmissions)) {
        saveContactSubmissions(jsonData.contactSubmissions);
    }
    if (Array.isArray(jsonData.ecosystemBrands)) {
        saveEcosystemBrands(jsonData.ecosystemBrands);
    }
    if (Array.isArray(jsonData.clientPhotos)) {
        saveClientPhotos(jsonData.clientPhotos);
    }
    return true;
}


// =========================================================================
// 6. SMOOTH SCROLL ANIMATION OBSERVER
// =========================================================================
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, h1, h2, h3, .bulb-block, .skew, .box, .service-box, .pricing-box, .client-photo-card').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
    });

    const elementsToAnimate = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, ' +
        'h1, h2, .font24, .font20, .bulb-block, .skew, .section-title, .pricing-box, .category-item, ' +
        '.box, .service-box, .testimonial-item, .client-photo-card, .eco-brand-admin-card, .marker-list > li, .contact-card'
    );

    elementsToAnimate.forEach((el, index) => {
        if (!el.classList.contains('scroll-reveal') && !el.classList.contains('scroll-reveal-left') && !el.classList.contains('scroll-reveal-right') && !el.classList.contains('scroll-reveal-scale')) {
            el.classList.add('scroll-reveal');
        }

        // Add subtle stagger to siblings in grid or list
        if (el.parentElement && el.parentElement.children.length > 1) {
            const siblingIndex = Array.from(el.parentElement.children).indexOf(el);
            if (siblingIndex > 0 && siblingIndex <= 6) {
                el.style.transitionDelay = `${(siblingIndex * 0.12).toFixed(2)}s`;
            }
        }

        // Check if already in viewport on load
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            setTimeout(() => {
                el.classList.add('visible');
            }, (index % 4) * 80);
        } else {
            observer.observe(el);
        }
    });
}


// -------------------------------------------------------------------------
// 7. AUTO-SYNC WITH SERVER ON PAGE LOAD
// -------------------------------------------------------------------------
function syncWithServer() {
    fetch(`${API_ENDPOINT}?action=get_all`)
        .then(res => res.json())
        .then(res => {
            if (res && res.status === 'success' && res.data) {
                const { clientPhotos, ecosystemBrands, contactSubmissions, siteLogo, siteTheme } = res.data;
                
                if (siteTheme) {
                    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(siteTheme));
                    applySiteTheme();
                }
                if (siteLogo && typeof siteLogo === 'object') {
                    localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(siteLogo));
                    applySiteLogo();
                }
                if (Array.isArray(clientPhotos) && clientPhotos.length > 0) {
                    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(clientPhotos));
                    if (typeof renderClientPhotos === 'function') renderClientPhotos();
                }
                if (Array.isArray(ecosystemBrands) && ecosystemBrands.length > 0) {
                    localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(ecosystemBrands));
                    if (document.getElementById("ecosystemTrack")) {
                        renderWebsiteEcosystem("ecosystemTrack");
                    }
                }
                if (Array.isArray(contactSubmissions)) {
                    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(contactSubmissions));
                    if (typeof renderLeads === 'function') renderLeads();
                }
            }
        })
        .catch(err => {
            // Static mode: uses local storage seamlessly
        });
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    applySiteTheme();
    applySiteLogo();
    initScrollAnimations();
    if (document.getElementById("ecosystemTrack")) {
        renderWebsiteEcosystem("ecosystemTrack");
    }
    syncWithServer();
});
