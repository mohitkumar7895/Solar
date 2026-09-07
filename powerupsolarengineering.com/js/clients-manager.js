/**
 * Liana Solar - Clients Manager (Bridge to site-data-manager.js)
 */
// If site-data-manager.js is not loaded, ensure fallback functions exist
if (typeof getClientPhotos !== "function") {
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

    const STORAGE_KEY = "liana_solar_client_photos_v2";

    function getClientPhotos() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Error reading client photos:", e);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENT_PHOTOS));
        return DEFAULT_CLIENT_PHOTOS;
    }

    function saveClientPhotos(photos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
        fetch('/api/data-api?action=save_photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photos)
        }).catch(err => console.log('Server API optional sync:', err));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENT_PHOTOS));
        return DEFAULT_CLIENT_PHOTOS;
    }
}
