/**
 * Liana Solar - Unified Site Data & Admin Manager
 * Handles:
 * 1. Hybrid Server Sync (data-api.php) for permanent live deployment (Hostinger/cPanel/PHP)
 * 2. Instant LocalStorage fallback for offline/preview
 * 3. Client Installation Photos Gallery
 * 4. Technology & Equipment Ecosystem Brands (Logos & Info)
 * 5. Contact Form Submissions & Leads Inbox
 */

const API_ENDPOINT = "data-api.php";

// =========================================================================
// 0. SITE BRANDING & LOGO MANAGEMENT
// =========================================================================
const LOGO_STORAGE_KEY = "liana_solar_site_branding_v1";

const DEFAULT_SITE_LOGO = {
    mode: "default", // "default" (pure crisp HTML & tagline) or "image" (custom uploaded logo)
    imageUrl: "images/logo.jpeg",
    name: "Liana",
    sub: "Solar",
    tagline: "POWERING A BRIGHTER TOMORROW",
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
    // Optional server sync
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
            // Default crisp typography with high-contrast visible tagline
            container.innerHTML = `
                <img src="images/bolt.gif" class="logo-bolt" alt="Liana Solar">
                <span class="logo-words ${isFooter ? 'logo-words--invert' : ''}">
                    <span class="logo-brand-row">
                        <strong class="logo-name">${config.name || 'Liana'}</strong>
                        <span class="logo-sub">${config.sub || 'Solar'}</span>
                    </span>
                    <span class="logo-tagline">— ${config.tagline || 'POWERING A BRIGHTER TOMORROW'} —</span>
                </span>
            `;
        }
    });
}

// =========================================================================
// 1. CLIENT PHOTOS MANAGEMENT
// =========================================================================
const DEFAULT_CLIENT_PHOTOS = [
    { id: "cp-1", image: "images/solar/hero-rooftop-home.jpg", date: "2026-03-01" },
    { id: "cp-2", image: "images/solar/rooftop-commercial.jpg", date: "2026-03-01" },
    { id: "cp-3", image: "images/category-img-4.png", date: "2026-03-01" },
    { id: "cp-4", image: "images/solar/rooftop-residential.jpg", date: "2026-03-01" },
    { id: "cp-5", image: "images/solar/hybrid-system.jpg", date: "2026-03-01" },
    { id: "cp-6", image: "images/category-img-2.png", date: "2026-03-01" },
    { id: "cp-7", image: "images/gallery/gallery-img-01.jpg", date: "2026-03-01" },
    { id: "cp-8", image: "images/gallery/gallery-img-02.jpg", date: "2026-03-01" },
    { id: "cp-9", image: "images/gallery/gallery-img-04.jpg", date: "2026-03-01" },
    { id: "cp-10", image: "images/gallery/gallery-img-05.jpg", date: "2026-03-01" },
    { id: "cp-11", image: "images/gallery/gallery-img-07.jpg", date: "2026-03-01" },
    { id: "cp-12", image: "images/gallery/gallery-img-08.jpg", date: "2026-03-01" }
];

const PHOTOS_STORAGE_KEY = "liana_solar_client_photos_v2";

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
    // Asynchronously save live on server
    fetch(`${API_ENDPOINT}?action=save_photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photos)
    }).then(res => res.json()).then(data => {
        if (data && data.data) {
            // Update local storage with any real image paths from server
            localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(data.data));
        }
    }).catch(err => {
        console.log("Server API optional sync:", err);
    });
}

function addClientPhotos(imagesList) {
    const current = getClientPhotos();
    const today = new Date().toISOString().split("T")[0];
    const newItems = imagesList.map((imgBase64, idx) => ({
        id: "cp-" + Date.now() + "-" + idx,
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
// 2. TECHNOLOGY & EQUIPMENT ECOSYSTEM MANAGEMENT
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
    // Asynchronously save live on server
    fetch(`${API_ENDPOINT}?action=save_ecosystem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brands)
    }).then(res => res.json()).then(data => {
        if (data && data.data) {
            localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(data.data));
        }
    }).catch(err => {
        console.log("Server API optional sync:", err);
    });
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

    // Generate cards HTML for a single set
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
// 3. CONTACT SUBMISSIONS & LEADS INBOX MANAGEMENT
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
    // Asynchronously save live on server
    fetch(`${API_ENDPOINT}?action=save_leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissions)
    }).catch(err => {
        console.log("Server API optional sync:", err);
    });
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

    // Also submit directly to server lead API
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
// 4. FULL SITE BACKUP & RESTORE
// =========================================================================
function exportAllSiteDataJson() {
    const fullData = {
        meta: {
            appName: "Liana Solar Admin Database",
            exportedAt: new Date().toISOString(),
            version: "2.0"
        },
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

// -------------------------------------------------------------------------
// 5. AUTO-SYNC WITH SERVER ON PAGE LOAD
// -------------------------------------------------------------------------
function syncWithServer() {
    fetch(`${API_ENDPOINT}?action=get_all`)
        .then(res => res.json())
        .then(res => {
            if (res && res.status === 'success' && res.data) {
                const { clientPhotos, ecosystemBrands, contactSubmissions, siteLogo } = res.data;
                let hasChanges = false;
                
                if (siteLogo && typeof siteLogo === 'object') {
                    localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(siteLogo));
                    applySiteLogo();
                }
                if (Array.isArray(clientPhotos) && clientPhotos.length > 0) {
                    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(clientPhotos));
                    hasChanges = true;
                    if (typeof renderClientPhotos === 'function') renderClientPhotos();
                }
                if (Array.isArray(ecosystemBrands) && ecosystemBrands.length > 0) {
                    localStorage.setItem(ECOSYSTEM_STORAGE_KEY, JSON.stringify(ecosystemBrands));
                    hasChanges = true;
                    if (document.getElementById("ecosystemTrack")) {
                        renderWebsiteEcosystem("ecosystemTrack");
                    }
                }
                if (Array.isArray(contactSubmissions)) {
                    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(contactSubmissions));
                    hasChanges = true;
                    if (typeof renderLeads === 'function') renderLeads();
                }
            }
        })
        .catch(err => {
            // Offline / static server mode: works perfectly with local storage
        });
}

// Initial trigger on load
window.addEventListener("DOMContentLoaded", () => {
    applySiteLogo();
    if (document.getElementById("ecosystemTrack")) {
        renderWebsiteEcosystem("ecosystemTrack");
    }
    syncWithServer();
});
