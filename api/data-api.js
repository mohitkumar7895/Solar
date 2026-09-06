/**
 * Liana Solar - Node.js Serverless API (Vercel)
 * Replaces data-api.php with full MySQL support.
 *
 * Endpoints (via ?action=...):
 *   GET  get_all       – Fetch all site data (photos, brands, leads, logo, theme)
 *   POST verify_pin    – Admin PIN login
 *   POST logout        – Admin logout
 *   POST save_theme    – Save site theme (auth required)
 *   POST save_logo     – Save site logo (auth required)
 *   POST save_photos   – Save client photos (auth required)
 *   POST save_ecosystem – Save ecosystem brands (auth required)
 *   POST submit_lead   – Contact form submission (public)
 *   POST save_leads    – Update leads list (auth required)
 */

const mysql = require('mysql2/promise');

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// In-memory session store (per-instance; good enough for Vercel serverless with cookies)
// For production, consider using a proper session store (Redis, DB-backed, JWT tokens)
// Using a simple token-based approach here
const crypto = require('crypto');
const sessions = {};

// Database connection pool
let pool = null;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'lianasolar',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

// Initialize tables on first call
let tablesInitialized = false;
async function initializeTables() {
  if (tablesInitialized) return;
  const db = getPool();
  const statements = [
    `CREATE TABLE IF NOT EXISTS site_theme (
      id INT PRIMARY KEY DEFAULT 1,
      data JSON NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS site_logo (
      id INT PRIMARY KEY DEFAULT 1,
      imageUrl VARCHAR(255),
      altText VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS ecosystem_brands (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brandName VARCHAR(100),
      logo VARCHAR(255),
      info TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS client_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150),
      image VARCHAR(255),
      description TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS contact_submissions (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100),
      phone VARCHAR(30),
      email VARCHAR(100),
      city VARCHAR(100),
      systemType VARCHAR(100),
      bill VARCHAR(100),
      message TEXT,
      date DATE,
      time TIME,
      status VARCHAR(20)
    )`,
  ];
  for (const sql of statements) {
    await db.execute(sql);
  }
  tablesInitialized = true;
}

// HTML-escape helper
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Parse auth token from cookie header
function getSessionToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/liana_session=([^;]+)/);
  return match ? match[1] : null;
}

function isAuthenticated(req) {
  const token = getSessionToken(req);
  return token && sessions[token] === true;
}

// Parse request body
async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse action from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action') || '';

  try {
    await initializeTables();
    const db = getPool();

    // =========================================================================
    // 0. ADMIN PIN VERIFICATION
    // =========================================================================
    if (action === 'verify_pin' && req.method === 'POST') {
      const input = await parseBody(req);
      const pin = (input && input.pin) || '';
      if (pin === ADMIN_PIN) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions[token] = true;
        res.setHeader(
          'Set-Cookie',
          `liana_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
        );
        return res.status(200).json({ status: 'success', message: 'Authenticated', token });
      } else {
        return res.status(401).json({ status: 'error', message: 'Invalid PIN' });
      }
    }

    // =========================================================================
    // 0. LOGOUT
    // =========================================================================
    if (action === 'logout') {
      const token = getSessionToken(req);
      if (token) delete sessions[token];
      res.setHeader(
        'Set-Cookie',
        `liana_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
      );
      return res.status(200).json({ status: 'success', message: 'Logged out' });
    }

    // =========================================================================
    // 1. GET ALL DATA (FOR LIVE VISITORS & ADMIN SYNC)
    // =========================================================================
    if (action === 'get_all' && req.method === 'GET') {
      const [photos] = await db.execute('SELECT * FROM client_photos');
      const [ecosystem] = await db.execute('SELECT * FROM ecosystem_brands');
      const [leads] = await db.execute(
        'SELECT * FROM contact_submissions ORDER BY date DESC, time DESC'
      );
      const [logoRows] = await db.execute('SELECT imageUrl, altText FROM site_logo LIMIT 1');
      const logo = logoRows.length > 0 ? logoRows[0] : null;
      const [themeRows] = await db.execute('SELECT data FROM site_theme LIMIT 1');
      let theme = null;
      if (themeRows.length > 0) {
        try {
          theme = typeof themeRows[0].data === 'string'
            ? JSON.parse(themeRows[0].data)
            : themeRows[0].data;
        } catch { theme = null; }
      }

      return res.status(200).json({
        status: 'success',
        serverLive: true,
        data: {
          clientPhotos: photos,
          ecosystemBrands: ecosystem,
          contactSubmissions: leads,
          siteLogo: logo,
          siteTheme: theme,
        },
      });
    }

    // =========================================================================
    // 1.4 SAVE SITE THEME (ADMIN - AUTH REQUIRED)
    // =========================================================================
    if (action === 'save_theme' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      const input = await parseBody(req);
      if (!input) {
        return res.status(400).json({ status: 'error', message: 'Invalid data' });
      }
      await db.execute(
        'INSERT INTO site_theme (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
        [JSON.stringify(input)]
      );
      return res.status(200).json({
        status: 'success',
        message: 'Theme saved live on server',
        data: input,
      });
    }

    // =========================================================================
    // 1.5 SAVE SITE LOGO (ADMIN - AUTH REQUIRED)
    // =========================================================================
    if (action === 'save_logo' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      const input = await parseBody(req);
      if (!input || typeof input !== 'object') {
        return res.status(400).json({ status: 'error', message: 'Invalid data' });
      }
      // Note: base64 image saving to filesystem is not possible on Vercel serverless.
      // Images should be stored as base64 in DB or uploaded to a cloud storage (S3, Cloudinary).
      // For now, we store the imageUrl as-is (base64 data URI or external URL).
      await db.execute(
        'INSERT INTO site_logo (id, imageUrl, altText) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE imageUrl = VALUES(imageUrl), altText = VALUES(altText)',
        [input.imageUrl || null, input.altText || null]
      );
      return res.status(200).json({
        status: 'success',
        message: 'Logo saved live on server',
        data: input,
      });
    }

    // =========================================================================
    // 2. SAVE CLIENT PHOTOS (ADMIN - AUTH REQUIRED)
    // =========================================================================
    if (action === 'save_photos' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      const input = await parseBody(req);
      if (!Array.isArray(input)) {
        return res.status(400).json({ status: 'error', message: 'Invalid data' });
      }
      // Clear and re-insert
      await db.execute('DELETE FROM client_photos');
      for (const photo of input) {
        await db.execute(
          'INSERT INTO client_photos (title, image, description) VALUES (?, ?, ?)',
          [photo.title || null, photo.image || null, photo.description || null]
        );
      }
      return res.status(200).json({
        status: 'success',
        message: 'Photos saved live on server',
        data: input,
      });
    }

    // =========================================================================
    // 3. SAVE ECOSYSTEM BRANDS (ADMIN - AUTH REQUIRED)
    // =========================================================================
    if (action === 'save_ecosystem' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      const input = await parseBody(req);
      if (!Array.isArray(input)) {
        return res.status(400).json({ status: 'error', message: 'Invalid data' });
      }
      await db.execute('DELETE FROM ecosystem_brands');
      for (const b of input) {
        await db.execute(
          'INSERT INTO ecosystem_brands (brandName, logo, info) VALUES (?, ?, ?)',
          [b.brandName || null, b.logo || null, b.info || null]
        );
      }
      return res.status(200).json({
        status: 'success',
        message: 'Ecosystem brands saved live on server',
        data: input,
      });
    }

    // =========================================================================
    // 4. SUBMIT CONTACT LEAD (PUBLIC - NO AUTH)
    // =========================================================================
    if (action === 'submit_lead' && req.method === 'POST') {
      const input = await parseBody(req);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 5);  // HH:MM

      const newLead = {
        id: 'sub-' + Date.now(),
        name: esc(input?.name || 'Anonymous'),
        phone: esc(input?.phone || ''),
        email: esc(input?.email || ''),
        city: esc(input?.city || 'Uttar Pradesh'),
        systemType: esc(input?.systemType || 'Solar Inquiry'),
        bill: esc(input?.bill || ''),
        message: esc(input?.message || ''),
        date: dateStr,
        time: timeStr,
        status: 'new',
      };

      await db.execute(
        'INSERT INTO contact_submissions (id, name, phone, email, city, systemType, bill, message, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          newLead.id,
          newLead.name,
          newLead.phone,
          newLead.email,
          newLead.city,
          newLead.systemType,
          newLead.bill,
          newLead.message,
          newLead.date,
          newLead.time,
          newLead.status,
        ]
      );

      return res.status(200).json({ status: 'success', lead: newLead });
    }

    // =========================================================================
    // 5. UPDATE LEADS LIST (ADMIN - AUTH REQUIRED)
    // =========================================================================
    if (action === 'save_leads' && req.method === 'POST') {
      if (!isAuthenticated(req)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      const input = await parseBody(req);
      if (!Array.isArray(input)) {
        return res.status(400).json({ status: 'error', message: 'Invalid data' });
      }
      // Clear and re-insert all leads
      await db.execute('DELETE FROM contact_submissions');
      for (const lead of input) {
        await db.execute(
          'INSERT INTO contact_submissions (id, name, phone, email, city, systemType, bill, message, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            lead.id || 'sub-' + Date.now(),
            lead.name || null,
            lead.phone || null,
            lead.email || null,
            lead.city || null,
            lead.systemType || null,
            lead.bill || null,
            lead.message || null,
            lead.date || null,
            lead.time || null,
            lead.status || 'new',
          ]
        );
      }
      return res.status(200).json({ status: 'success', message: 'Leads updated' });
    }

    // =========================================================================
    // DEFAULT: Invalid action
    // =========================================================================
    return res.status(400).json({ status: 'error', message: 'Invalid action' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Server error: ' + (err.message || 'Unknown'),
    });
  }
};
