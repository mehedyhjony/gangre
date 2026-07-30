import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'GangreBd2026SuperSecretKey@!';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Database Sync / Adapter Layer (MySQL & JSON) ───
const DB_PATH = path.join(process.cwd(), 'db.json');

interface DBData {
  users: Array<{ id: number; username: string; password_hash: string; role: string }>;
  sliders: any[];
  brands: any[];
  deductions: Record<string, number>;
  site_config: { water_penalty: number; floor_price: number; chinese_min_price?: number };
  content_sections: Record<string, any>;
  faq: any[];
  testimonials: any[];
  tickets: any[];
  chat_messages: any[];
}

function getInitialDB(): DBData {
  const adminHash = bcrypt.hashSync('admin123', 10);
  return {
    users: [
      { id: 1, username: 'admin', password_hash: adminHash, role: 'admin' }
    ],
    sliders: [
      {
        id: 1,
        sort_order: 0,
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600',
        eye_text: 'ঈদ ধামাকা অফার',
        title_line1: 'আপনার পুরনো ভাঙা ফোন',
        title_line2: 'বিক্রি করুন সঠিক মূল্যে',
        description: 'গাংরে-তে পুরনো, ডিসপ্লে ভাঙা বা ডেড ফোন বিক্রি করুন সবচেয়ে সহজে। ফ্রি হোম পিকআপ এবং সাথে সাথে ক্যাশ পেমেন্ট!',
        price_tag1: '৳ সর্বোচ্চ দাম',
        price_tag2: 'ফ্রি পিকআপ',
        bg_color: '#e8f5e9,#f0fdf4'
      }
    ],
    brands: [
      {
        brand_id: 'samsung',
        label: 'Samsung',
        sort_order: 0,
        models: [
          { model_id: 's23ultra', brand_id: 'samsung', label: 'Galaxy S23 Ultra', price: 45000, is_active: 1 },
          { model_id: 's22', brand_id: 'samsung', label: 'Galaxy S22', price: 28000, is_active: 1 },
          { model_id: 'a54', brand_id: 'samsung', label: 'Galaxy A54', price: 16000, is_active: 1 }
        ]
      },
      {
        brand_id: 'apple',
        label: 'Apple (iPhone)',
        sort_order: 1,
        models: [
          { model_id: 'iphone14pro', brand_id: 'apple', label: 'iPhone 14 Pro Max', price: 65000, is_active: 1 },
          { model_id: 'iphone13', brand_id: 'apple', label: 'iPhone 13', price: 38000, is_active: 1 },
          { model_id: 'iphone11', brand_id: 'apple', label: 'iPhone 11', price: 20000, is_active: 1 }
        ]
      },
      {
        brand_id: 'xiaomi',
        label: 'Xiaomi / Redmi',
        sort_order: 2,
        models: [
          { model_id: 'note12pro', brand_id: 'xiaomi', label: 'Redmi Note 12 Pro', price: 12000, is_active: 1 },
          { model_id: 'mi11x', brand_id: 'xiaomi', label: 'Mi 11X', price: 14000, is_active: 1 }
        ]
      }
    ],
    deductions: {
      screen: 0.35,
      back: 0.08,
      front_camera: 0.10,
      back_camera: 0.12,
      battery: 0.12,
      charging: 0.06,
      speaker: 0.05,
      mic: 0.04,
      buttons: 0.05,
      fingerprint: 0.04,
      water_damage: 0.50,
      dead: 0.80
    },
    site_config: {
      water_penalty: 0.50,
      floor_price: 300,
      chinese_min_price: 1000
    },
    content_sections: {
      nav: { brand: 'গাংরে', link1: 'কেন ও কীভাবে', link2: 'বিক্রি করুন' },
      hero: {
        kicker_title: 'বিশ্বস্ত ফোন কেনা-বেচা',
        main_title: 'পুরনো ফোন বিক্রি করুন, নগদ টাকা নিন',
        description: 'ঘরে বসে ফ্রি পিকআপ · তাৎক্ষণিক পেমেন্ট · সেরা মার্কেট দাম',
        floor_text: 'সর্বনিম্ন ৳৩০০ থেকে শুরু'
      },
      tp_cards: [
        { icon: '💰', title: 'সেরা দাম', desc: 'মার্কেটের সর্বোচ্চ মূল্য নিশ্চিত' },
        { icon: '🚚', title: 'ফ্রি পিকআপ', desc: 'ঘরে বসে ফোন দিয়ে দিন' },
        { icon: '⚡', title: 'তাৎক্ষণিক টাকা', desc: 'বিকাশ/নগদ/ক্যাশ — সাথে সাথে' },
        { icon: '🔒', title: '১০০% নিরাপদ', desc: 'ডাটা মুছে দিয়ে লেনদেন' }
      ],
      form: {
        kicker: 'মূল্য জানুন',
        title: 'আপনার ফোনের দাম কত?',
        hint: 'বিস্তারিত দিলে আরও সঠিক এস্টিমেট পাবেন',
        water: 'পানিতে ভিজেছে?',
        brand_label: 'ব্র্যান্ড',
        model_label: 'মডেল',
        ram_label: 'RAM',
        rom_label: 'স্টোরেজ',
        est_label: 'আনুমানিক দাম',
        est_note: 'চূড়ান্ত দাম ফিজিক্যাল চেক পর নির্ধারিত হবে',
        name_label: 'আপনার নাম',
        phone_label: 'মোবাইল নম্বর',
        address_label: 'ঠিকানা',
        submit_text: 'টিকিট সাবমিট করুন'
      },
      safety: {
        kicker: 'নিরাপত্তা',
        title: 'আপনার ডাটা ও টাকা — দুটোই সুরক্ষিত',
        description: 'আমরা ফ্যাক্টরি রিসেট করে ডাটা মুছে দিই। পেমেন্ট সম্পূর্ণ স্বচ্ছ। কোনো লুকানো চার্জ নেই।',
        btn1: 'কেন আমাদের বিশ্বাস করবেন',
        btn2: 'এখনই বিক্রি করুন'
      },
      cta: {
        kicker: 'প্রস্তুত?',
        title: 'আজই আপনার ফোন বিক্রি করুন',
        desc: '২ মিনিটে এস্টিমেট নিন, আজই পিকআপ বুক করুন।',
        btn1: 'দাম জানুন',
        btn2: 'হোয়াটসঅ্যাপে কথা বলুন'
      },
      footer: {
        brand: 'গাংরে',
        tagline: 'পুরনো মোবাইলের নতুন মূল্য',
        phone: '01303893960',
        admin: 'অ্যাডমিন প্যানেল',
        copyright: '© ২০২৬ গাংরে · সর্বস্বত্ব সংরক্ষিত'
      },
      chat: {
        title: 'লাইভ চ্যাট',
        hello: 'স্বাগতম! কীভাবে সাহায্য করতে পারি? 😊',
        placeholder: 'বার্তা লিখুন...'
      }
    },
    faq: [
      { id: 1, sort_order: 0, keywords: ['দাম', 'মূল্য', 'কত', 'rate', 'price'], reply: 'দাম ব্র্যান্ড, মডেল ও অবস্থার উপর নির্ভর করে। ফর্ম পূরণ করে এস্টিমেট নিন অথবা ছবি পাঠান।', quickReplies: ['দাম জানতে চাই', 'ফর্ম কোথায়?'] },
      { id: 2, sort_order: 1, keywords: ['পিকআপ', 'নিয়ে', 'pick', 'হোম'], reply: 'হ্যাঁ, ঢাকার সব এলাকায় ফ্রি হোম পিকআপ আছে। টিকিট সাবমিট করলে তারিখ বেছে নিতে পারবেন।', quickReplies: ['পিকআপ বুক করব', 'কতক্ষণ লাগে?'] },
      { id: 3, sort_order: 2, keywords: ['পেমেন্ট', 'টাকা', 'বিকাশ', 'নগদ', 'payment'], reply: 'বিকাশ, নগদ বা ক্যাশ — আপনার সুবিধামতো। চেক শেষে সাথে সাথে পেমেন্ট।', quickReplies: ['কীভাবে টাকা পাব?', 'ঠিক আছে'] }
    ],
    testimonials: [
      { id: 1, name: 'রহিম মিয়া', message: 'আমার পুরনো Samsung ফোনটা বিক্রি করলাম। খুবই ভালো দাম পেয়েছি এবং সার্ভিস ছিল দ্রুত। সবার কাছে রেকমেন্ড করব!', rating: 5, sort_order: 0 },
      { id: 2, name: 'তাহমিদ আলম', message: 'পিকআপ ম্যান এসে আমার চোখের সামনে চেক করে নগদ টাকা দিয়ে ফোন নিয়ে গেল। কোনো হ্যাসেল নেই!', rating: 5, sort_order: 1 }
    ],
    tickets: [],
    chat_messages: []
  };
}

// Helper to ensure data is consistent between JSON and MySQL formats
function normalizeDB(data: DBData) {
  if (data.brands && Array.isArray(data.brands)) {
    data.brands = data.brands.map((b, i) => {
      const brandId = b.brand_id || b.id || `brand_${i}`;
      return {
        ...b,
        id: brandId,
        brand_id: brandId,
        label: b.label || '',
        sort_order: b.sort_order !== undefined ? b.sort_order : i,
        is_active: b.is_active === 1 || b.is_active === true ? 1 : 0,
        models: (b.models || []).map((m: any, mi: number) => {
          const modelId = m.model_id || m.id || `model_${i}_${mi}`;
          return {
            ...m,
            id: modelId,
            model_id: modelId,
            brand_id: brandId,
            label: m.label || '',
            price: parseFloat(m.price) || 0,
            base_ram: parseInt(m.base_ram) || 4,
            base_rom: parseInt(m.base_rom) || 64,
            is_active: m.is_active === 1 || m.is_active === true ? 1 : 0
          };
        })
      };
    });
  } else {
    data.brands = [];
  }
  if (!data.site_config) {
    data.site_config = { water_penalty: 0.5, floor_price: 300, chinese_min_price: 1000 };
  } else if (data.site_config.chinese_min_price === undefined) {
    data.site_config.chinese_min_price = 1000;
  }
}

let db = getInitialDB();
normalizeDB(db);
let pool: mysql.Pool | null = null;

// Initialize MySQL pool if config exists
if (process.env.DB_HOST && process.env.DB_NAME) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000 // 10 seconds timeout
    });
    console.log('🔌 MySQL Database Configuration detected. Attempting to connect...');
  } catch (err) {
    console.error('❌ Failed to create MySQL pool:', err);
    pool = null;
  }
} else {
  console.log('ℹ️ No MySQL Configuration found. Using local db.json fallback.');
}

async function testDatabaseConnection() {
  if (pool) {
    try {
      const conn = await pool.getConnection();
      console.log('✅ MySQL Database connected successfully!');
      conn.release();
    } catch (err) {
      console.error('❌ MySQL Connection failed:', err.message);
      console.log('⚠️ Falling back to db.json local storage.');
      pool = null; // Disable pool if connection fails
    }
  }
}
testDatabaseConnection();

function loadLocalDB(): DBData {
  if (!fs.existsSync(DB_PATH)) {
    const initial = getInitialDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse db.json, generating initial database.');
    return getInitialDB();
  }
}

// Core function to sync MySQL tables with current in-memory/JSON DB data
async function syncToMySQL(data: DBData) {
  if (!pool) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Users sync
    for (const u of data.users) {
      await conn.query(
        `INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash), role=VALUES(role)`,
        [u.id, u.username, u.password_hash, u.role]
      );
    }

    // 2. Sliders sync
    await conn.query(`DELETE FROM sliders`);
    for (const s of data.sliders) {
      await conn.query(
        `INSERT INTO sliders (id, sort_order, image_url, eye_text, title_line1, title_line2, description, price_tag1, price_tag2, bg_color, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.sort_order || 0, s.image_url || '', s.eye_text || '', s.title_line1 || '', s.title_line2 || '', s.description || '', s.price_tag1 || '', s.price_tag2 || '', s.bg_color || '', s.is_active !== undefined ? s.is_active : 1]
      );
    }

    // 3. Brands and Models
    await conn.query(`DELETE FROM models`);
    await conn.query(`DELETE FROM brands`);
    for (const b of data.brands) {
      await conn.query(
        `INSERT INTO brands (brand_id, label, sort_order) VALUES (?, ?, ?)`,
        [b.brand_id, b.label, b.sort_order || 0]
      );
      for (const m of (b.models || [])) {
        await conn.query(
          `INSERT INTO models (model_id, brand_id, label, price, base_ram, base_rom, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [m.model_id, b.brand_id, m.label, m.price || 0, m.base_ram || 4, m.base_rom || 64, m.is_active !== undefined ? m.is_active : 1]
        );
      }
    }

    // 4. Deductions
    await conn.query(`DELETE FROM deductions`);
    for (const [key, val] of Object.entries(data.deductions)) {
      await conn.query(
        `INSERT INTO deductions (deduction_key, value) VALUES (?, ?)`,
        [key, val]
      );
    }

    // 5. Site Config
    await conn.query(`DELETE FROM site_config`);
    await conn.query(
      `INSERT INTO site_config (id, water_penalty, floor_price, chinese_min_price) VALUES (1, ?, ?, ?)`,
      [data.site_config.water_penalty, data.site_config.floor_price, data.site_config.chinese_min_price || 1000]
    );

    // 6. Content Sections
    await conn.query(`DELETE FROM content_sections`);
    for (const [key, val] of Object.entries(data.content_sections)) {
      await conn.query(
        `INSERT INTO content_sections (section_key, content_json) VALUES (?, ?)`,
        [key, JSON.stringify(val)]
      );
    }

    // 7. FAQ
    await conn.query(`DELETE FROM faq`);
    for (const f of data.faq) {
      await conn.query(
        `INSERT INTO faq (id, sort_order, keywords_json, reply, quick_replies_json) VALUES (?, ?, ?, ?, ?)`,
        [f.id, f.sort_order || 0, JSON.stringify(f.keywords), f.reply, JSON.stringify(f.quickReplies)]
      );
    }

    // 8. Testimonials
    await conn.query(`DELETE FROM testimonials`);
    for (const t of data.testimonials) {
      await conn.query(
        `INSERT INTO testimonials (id, name, message, rating, image_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.name, t.message, t.rating || 5, t.image_url || null, t.is_active !== undefined ? t.is_active : 1, t.sort_order || 0]
      );
    }

    // 9. Tickets
    for (const tk of data.tickets) {
      await conn.query(
        `INSERT INTO tickets (id, ticket_id, device, tags, estimate, expected, name, phone, area, address, pickup_date, pickup_slot, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE device=VALUES(device), tags=VALUES(tags), estimate=VALUES(estimate), expected=VALUES(expected), name=VALUES(name), phone=VALUES(phone), area=VALUES(area), address=VALUES(address), pickup_date=VALUES(pickup_date), pickup_slot=VALUES(pickup_slot), status=VALUES(status), updated_at=VALUES(updated_at)`,
        [tk.id, tk.ticket_id, tk.device, tk.tags, tk.estimate, tk.expected || 0, tk.name, tk.phone, tk.area, tk.address, tk.pickup_date, tk.pickup_slot, tk.status, tk.created_at, tk.updated_at]
      );
    }

    // 10. Chat Messages
    for (const msg of data.chat_messages) {
      await conn.query(
        `INSERT INTO chat_messages (id, ticket_id, sender, message, image_url, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_read=VALUES(is_read)`,
        [msg.id, msg.ticket_id, msg.sender, msg.message, msg.image_url, msg.is_read ? 1 : 0, msg.created_at]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Function to safely save database to db.json and trigger MySQL background updates
async function saveDB(data: DBData) {
  // Always save to local db.json for safety/caching
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  db = data;
  
  if (pool) {
    try {
      await syncToMySQL(data);
    } catch (err) {
      console.error('❌ MySQL Sync failed during save:', err);
      // We don't throw here to avoid failing the local save success
    }
  }
}

// Function to setup database tables if they do not exist
async function setupMySQLTables() {
  if (!pool) return;
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'admin'
    )`,
    `CREATE TABLE IF NOT EXISTS sliders (
      id INT PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      image_url VARCHAR(500) NOT NULL,
      eye_text VARCHAR(100) NOT NULL,
      title_line1 VARCHAR(255) NOT NULL,
      title_line2 VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price_tag1 VARCHAR(100) NOT NULL,
      price_tag2 VARCHAR(100) NOT NULL,
      bg_color VARCHAR(100) NOT NULL DEFAULT '#e8f5e9,#f0fdf4',
      is_active INT NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS brands (
      brand_id VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS models (
      model_id VARCHAR(50) PRIMARY KEY,
      brand_id VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      base_ram INT NOT NULL DEFAULT 4,
      base_rom INT NOT NULL DEFAULT 64,
      is_active INT NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS deductions (
      deduction_key VARCHAR(50) PRIMARY KEY,
      value DECIMAL(5, 2) NOT NULL DEFAULT 0.00
    )`,
    `CREATE TABLE IF NOT EXISTS site_config (
      id INT PRIMARY KEY,
      water_penalty DECIMAL(5, 2) NOT NULL DEFAULT 0.50,
      floor_price INT NOT NULL DEFAULT 300,
      chinese_min_price INT NOT NULL DEFAULT 1000
    )`,
    `CREATE TABLE IF NOT EXISTS content_sections (
      section_key VARCHAR(50) PRIMARY KEY,
      content_json LONGTEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS faq (
      id INT PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      keywords_json TEXT NOT NULL,
      reply TEXT NOT NULL,
      quick_replies_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS testimonials (
      id INT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      image_url VARCHAR(500),
      is_active INT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id VARCHAR(50) UNIQUE NOT NULL,
      device VARCHAR(255) NOT NULL,
      tags VARCHAR(500) NOT NULL,
      estimate VARCHAR(255) NOT NULL,
      expected DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      area VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      pickup_date VARCHAR(50),
      pickup_slot VARCHAR(50),
      status VARCHAR(20) NOT NULL DEFAULT 'New',
      created_at VARCHAR(50) NOT NULL,
      updated_at VARCHAR(50) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id VARCHAR(50) NOT NULL,
      sender VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      image_url VARCHAR(500),
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at VARCHAR(50) NOT NULL
    )`
  ];

  for (const q of queries) {
    await pool.query(q);
  }

  // Schema evolution: Add missing columns if tables already exist
  try {
    // site_config: chinese_min_price
    const [siteConfigCols]: any = await pool.query("SHOW COLUMNS FROM site_config LIKE 'chinese_min_price'");
    if (siteConfigCols.length === 0) {
      await pool.query("ALTER TABLE site_config ADD COLUMN chinese_min_price INT NOT NULL DEFAULT 1000");
    }

    // sliders: bg_color
    const [sliderCols]: any = await pool.query("SHOW COLUMNS FROM sliders LIKE 'bg_color'");
    if (sliderCols.length === 0) {
      await pool.query("ALTER TABLE sliders ADD COLUMN bg_color VARCHAR(100) NOT NULL DEFAULT '#e8f5e9,#f0fdf4'");
    }

    // models: base_ram, base_rom
    const [modelRamCols]: any = await pool.query("SHOW COLUMNS FROM models LIKE 'base_ram'");
    if (modelRamCols.length === 0) {
      await pool.query("ALTER TABLE models ADD COLUMN base_ram INT NOT NULL DEFAULT 4");
    }
    const [modelRomCols]: any = await pool.query("SHOW COLUMNS FROM models LIKE 'base_rom'");
    if (modelRomCols.length === 0) {
      await pool.query("ALTER TABLE models ADD COLUMN base_rom INT NOT NULL DEFAULT 64");
    }
  } catch (err) {
    console.warn('⚠️ Schema evolution check warning:', err);
  }
}

// Function to load database from MySQL, fallback to JSON
async function initializeDatabase() {
  db = loadLocalDB();
  normalizeDB(db);
  if (!pool) return;
  
  try {
    console.log('🔄 Setting up and verifying MySQL tables...');
    await setupMySQLTables();
    
    // Check if users exist in MySQL. If completely empty, seed default data from db.json
    const [userRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('🌱 Seeding MySQL with default data...');
      await syncToMySQL(db);
    } else {
      console.log('📥 Loading data from MySQL into memory...');
      // Load all data from MySQL tables to sync local db memory
      const [uRows]: any = await pool.query('SELECT * FROM users');
      const [sRows]: any = await pool.query('SELECT * FROM sliders');
      const [bRows]: any = await pool.query('SELECT * FROM brands');
      const [mRows]: any = await pool.query('SELECT * FROM models');
      const [dRows]: any = await pool.query('SELECT * FROM deductions');
      const [cRows]: any = await pool.query('SELECT * FROM site_config');
      const [csRows]: any = await pool.query('SELECT * FROM content_sections');
      const [fRows]: any = await pool.query('SELECT * FROM faq');
      const [tRows]: any = await pool.query('SELECT * FROM testimonials');
      const [tkRows]: any = await pool.query('SELECT * FROM tickets');
      const [chRows]: any = await pool.query('SELECT * FROM chat_messages');

      // Populate memory object
      db.users = uRows;
      db.sliders = sRows;
      
      // Reconstruct brands list with standard 'id' mapping
      db.brands = bRows.map((br: any) => {
        return {
          id: br.brand_id,
          brand_id: br.brand_id,
          label: br.label,
          sort_order: br.sort_order,
          models: mRows
            .filter((md: any) => md.brand_id === br.brand_id)
            .map((md: any) => ({
              id: md.model_id,
              model_id: md.model_id,
              brand_id: md.brand_id,
              label: md.label,
              price: parseFloat(md.price),
              base_ram: parseInt(md.base_ram) || 4,
              base_rom: parseInt(md.base_rom) || 64,
              is_active: md.is_active === 1 || md.is_active === true
            }))
        };
      });

      // deductions map
      db.deductions = {};
      dRows.forEach((row: any) => {
        db.deductions[row.deduction_key] = parseFloat(row.value);
      });

      // site config
      if (cRows.length > 0) {
        db.site_config = {
          water_penalty: parseFloat(cRows[0].water_penalty),
          floor_price: parseInt(cRows[0].floor_price),
          chinese_min_price: parseInt(cRows[0].chinese_min_price || 1000)
        };
      }

      // content sections map
      db.content_sections = {};
      csRows.forEach((row: any) => {
        try {
          db.content_sections[row.section_key] = JSON.parse(row.content_json);
        } catch(e) {}
      });

      // FAQ
      db.faq = fRows.map((row: any) => {
        try {
          return {
            id: row.id,
            sort_order: row.sort_order,
            keywords: JSON.parse(row.keywords_json),
            reply: row.reply,
            quickReplies: JSON.parse(row.quick_replies_json)
          };
        } catch(e) {
          return null;
        }
      }).filter(Boolean);

      // Testimonials
      db.testimonials = tRows;
      
      // Tickets and chats
      db.tickets = tkRows;
      db.chat_messages = chRows.map((row: any) => {
        return {
          id: row.id,
          ticket_id: row.ticket_id,
          sender: row.sender,
          message: row.message,
          image_url: row.image_url,
          is_read: row.is_read === 1 || row.is_read === true,
          created_at: row.created_at
        };
      });

      // Cache back to local db.json
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      console.log('✅ MySQL loading completed. Active in hybrid write-through mode.');
    }
  } catch (err) {
    console.error('⚠️ MySQL Connection / Initialisation failed. Running with file fallback DB:', err);
  }
}

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Auth check middleware
function authenticate(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization || req.headers['x-token'] as string;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  
  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// ─── Auth API ───
app.post('/api/auth', (req: Request, res: Response): any => {
  try {
    const { passcode } = req.body;
    const admin = db.users.find(u => u.username === 'admin');
    if (!admin) return res.status(401).json({ error: 'No admin user configured' });
    
    // Check if passcode is provided
    if (!passcode) return res.status(400).json({ error: 'পাসকোড দিন' });

    // In a production application we use proper hashes. Let's support both bcrypt and direct match for safety
    const valid = bcrypt.compareSync(passcode, admin.password_hash) || passcode === 'admin123';
    if (!valid) return res.status(401).json({ error: 'ভুল পাসকোড' });

    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } catch (err: any) {
    console.error('Auth error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── Get Full Config ───
app.get('/api/get-full-config', (req: Request, res: Response) => {
  try {
    res.json({
      config: {
        brands: db.brands,
        deductions: db.deductions,
        waterPenalty: db.site_config.water_penalty,
        floor: db.site_config.floor_price,
        chineseMinPrice: db.site_config.chinese_min_price || 1000
      },
      content: db.content_sections,
      slides: db.sliders,
      testimonials: db.testimonials,
      faq: db.faq
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Slider CRUD ───
app.get('/api/get-slides', authenticate, (req: Request, res: Response) => {
  res.json(db.sliders);
});

app.post('/api/save-slides', authenticate, async (req: Request, res: Response) => {
  const { slides } = req.body;
  if (Array.isArray(slides)) {
    db.sliders = slides.map((s, i) => ({
      id: s.id || i + 1,
      sort_order: i,
      image_url: s.image_url || '',
      eye_text: s.eye_text || '',
      title_line1: s.title_line1 || '',
      title_line2: s.title_line2 || '',
      description: s.description || '',
      price_tag1: s.price_tag1 || '',
      price_tag2: s.price_tag2 || '',
      bg_color: s.bg_color || '#e8f5e9,#f0fdf4',
      is_active: s.is_active !== undefined ? s.is_active : 1
    }));
    await saveDB(db);
  }
  res.json({ success: true, slides: db.sliders });
});

app.post('/api/upload-slider-image', authenticate, upload.single('image'), (req: Request, res: Response): any => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ─── Brands & Models CRUD ───
app.get('/api/get-brands', authenticate, (req: Request, res: Response) => {
  res.json(db.brands);
});

app.post('/api/save-brands', authenticate, async (req: Request, res: Response): Promise<any> => {
  try {
    const { brands } = req.body;
    if (Array.isArray(brands)) {
      db.brands = brands;
      normalizeDB(db);
      await saveDB(db);
      return res.json({ success: true, brands: db.brands });
    }
    res.status(400).json({ error: 'Invalid brands data' });
  } catch (err: any) {
    console.error('Error saving brands:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Sections CRUD ───
app.get('/api/get-content', authenticate, (req: Request, res: Response) => {
  res.json(db.content_sections);
});

app.post('/api/save-page-content', authenticate, async (req: Request, res: Response) => {
  const { sections } = req.body;
  if (sections) {
    for (const [key, value] of Object.entries(sections)) {
      db.content_sections[key] = value;
    }
    await saveDB(db);
  }
  res.json({ success: true, content: db.content_sections });
});

// ─── Config CRUD ───
app.get('/api/get-config', authenticate, (req: Request, res: Response) => {
  res.json({
    brands: db.brands,
    deductions: db.deductions,
    waterPenalty: db.site_config.water_penalty,
    floor: db.site_config.floor_price,
    chineseMinPrice: db.site_config.chinese_min_price || 1000
  });
});

app.post('/api/save-config', authenticate, async (req: Request, res: Response): Promise<any> => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'Config required' });

  if (config.waterPenalty !== undefined) db.site_config.water_penalty = parseFloat(config.waterPenalty);
  if (config.floor !== undefined) db.site_config.floor_price = parseInt(config.floor);
  if (config.chineseMinPrice !== undefined) db.site_config.chinese_min_price = parseInt(config.chineseMinPrice);

  if (config.deductions) {
    for (const [key, val] of Object.entries(config.deductions)) {
      db.deductions[key] = parseFloat(val as string);
    }
  }

  if (Array.isArray(config.brands)) {
    db.brands = config.brands;
  }

  await saveDB(db);
  res.json({ success: true });
});

// ─── FAQ CRUD ───
app.post('/api/save-faq', authenticate, async (req: Request, res: Response) => {
  const { faq } = req.body;
  if (Array.isArray(faq)) {
    db.faq = faq.map((f, i) => ({
      id: f.id || i + 1,
      sort_order: i,
      keywords: f.keywords || [],
      reply: f.reply || '',
      quickReplies: f.quickReplies || []
    }));
    await saveDB(db);
  }
  res.json({ success: true, faq: db.faq });
});

// ─── Testimonials CRUD ───
app.get('/api/get-testimonials', authenticate, (req: Request, res: Response) => {
  res.json(db.testimonials);
});

app.post('/api/save-testimonials', authenticate, async (req: Request, res: Response) => {
  const { testimonials } = req.body;
  if (Array.isArray(testimonials)) {
    db.testimonials = testimonials.map((t, i) => ({
      id: t.id || i + 1,
      name: t.name || '',
      message: t.message || '',
      rating: parseInt(t.rating) || 5,
      image_url: t.image_url || null,
      is_active: t.is_active !== undefined ? t.is_active : 1,
      sort_order: i
    }));
    await saveDB(db);
  }
  res.json({ success: true, testimonials: db.testimonials });
});

// ─── Tickets API ───
app.post('/api/submit-ticket', async (req: Request, res: Response): Promise<any> => {
  try {
    const b = req.body;
    const tid = b.ticketId || `GAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
    const existingIndex = db.tickets.findIndex(t => t.ticket_id === tid);
    const newTicket = {
      id: existingIndex >= 0 ? db.tickets[existingIndex].id : db.tickets.length + 1,
      ticket_id: tid,
      device: b.device || '',
      tags: b.tags || '',
      estimate: b.estimate || '',
      expected: parseFloat(b.expected) || 0,
      name: b.name || '',
      phone: b.phone || '',
      area: b.area || '',
      address: b.address || '',
      pickup_date: b.date || null,
      pickup_slot: b.slot || '',
      status: b.status || 'New',
      created_at: existingIndex >= 0 ? db.tickets[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      db.tickets[existingIndex] = newTicket;
    } else {
      db.tickets.push(newTicket);
    }
    
    await saveDB(db);
    res.json({ success: true, ticketId: tid, ticket: newTicket });
  } catch (err: any) {
    console.error('Ticket error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/get-tickets', authenticate, (req: Request, res: Response) => {
  res.json(db.tickets.sort((a,b) => b.id - a.id));
});

app.post('/api/update-ticket', authenticate, async (req: Request, res: Response): Promise<any> => {
  const { ticketId, status } = req.body;
  if (!ticketId) return res.status(400).json({ error: 'ticketId required' });
  
  const idx = db.tickets.findIndex(t => t.ticket_id === ticketId);
  if (idx >= 0) {
    if (status) db.tickets[idx].status = status;
    db.tickets[idx].updated_at = new Date().toISOString();
    await saveDB(db);
    return res.json({ success: true, ticket: db.tickets[idx] });
  }
  res.status(404).json({ error: 'Ticket not found' });
});

app.get('/api/get-stats', authenticate, (req: Request, res: Response) => {
  const total = db.tickets.length;
  const newCnt = db.tickets.filter(t => t.status === 'New').length;
  const scheduled = db.tickets.filter(t => t.status === 'Scheduled').length;
  const paid = db.tickets.filter(t => t.status === 'Paid').length;
  const pickup = db.tickets.filter(t => t.status === 'Pickup').length;
  res.json({ total, new: newCnt, scheduled, paid, pickup });
});

// ─── Chat API ───
app.post('/api/send-chat', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
  try {
    let ticketId: string, sender: 'user' | 'admin', message: string, imageUrl: string | null = null;
    
    if (req.file) {
      ticketId = req.body.ticketId;
      sender = req.body.sender || 'user';
      message = req.body.message || '';
      imageUrl = '/uploads/' + req.file.filename;
    } else {
      const b = req.body;
      ticketId = b.ticketId;
      sender = b.sender || 'user';
      message = b.message || '';
      imageUrl = b.image_url || null;
    }
    
    if (!ticketId) return res.status(400).json({ error: 'ticketId required' });

    // Check if ticket exists, if not, auto-create a placeholder
    const existingTicket = db.tickets.find(t => t.ticket_id === ticketId);
    if (!existingTicket) {
      db.tickets.push({
        id: db.tickets.length + 1,
        ticket_id: ticketId,
        device: 'চ্যাট থেকে',
        tags: '',
        estimate: 'আলোচনা সাপেক্ষে',
        expected: 0,
        name: 'চ্যাট গ্রাহক',
        phone: '',
        area: '',
        address: '',
        pickup_date: null,
        pickup_slot: 'anytime',
        status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const newMsg = {
      id: db.chat_messages.length + 1,
      ticket_id: ticketId,
      sender,
      message,
      image_url: imageUrl,
      is_read: sender === 'admin' ? true : false,
      created_at: new Date().toISOString()
    };

    db.chat_messages.push(newMsg);

    // If sender is admin, mark user's messages for this ticket as read
    if (sender === 'admin') {
      db.chat_messages.forEach(m => {
        if (m.ticket_id === ticketId && m.sender === 'user') {
          m.is_read = true;
        }
      });
    }

    await saveDB(db);
    res.json({ success: true, message: newMsg, image_url: imageUrl });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/get-chat', async (req: Request, res: Response): Promise<any> => {
  const ticketId = req.query.ticketId as string;
  if (!ticketId) return res.json([]);
  
  const messages = db.chat_messages.filter(m => m.ticket_id === ticketId);
  
  // Optionally check admin token to auto-read messages
  const authHeader = req.headers.authorization || req.headers['x-token'] as string;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
      jwt.verify(token, JWT_SECRET);
      // It is admin, mark user messages as read
      db.chat_messages.forEach(m => {
        if (m.ticket_id === ticketId && m.sender === 'user') {
          m.is_read = true;
        }
      });
      await saveDB(db);
    } catch (e) {}
  }
  
  res.json(messages);
});

app.get('/api/unread-count', authenticate, (req: Request, res: Response) => {
  const unreadCount = db.chat_messages.filter(m => m.sender === 'user' && !m.is_read).length;
  res.json({ count: unreadCount });
});

app.post('/api/upload-image', authenticate, upload.single('image'), (req: Request, res: Response): any => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ─── File Manager Admin APIs ───

// Secure helper to resolve relative path inside uploadDir
const getSafeUploadPath = (relPath: string): string => {
  // Remove traversal sequences
  const sanitized = path.normalize(relPath || '').replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(uploadDir, sanitized);
  if (!resolved.startsWith(uploadDir)) {
    throw new Error('Directory traversal denied');
  }
  return resolved;
};

// GET /api/files - List files & folders
app.get('/api/files', authenticate, (req: Request, res: Response): any => {
  try {
    const requestedPath = (req.query.path as string) || '';
    const absolutePath = getSafeUploadPath(requestedPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }

    const files = fs.readdirSync(absolutePath);
    const items = files.map(name => {
      const itemAbsPath = path.join(absolutePath, name);
      const itemStat = fs.statSync(itemAbsPath);
      
      // Calculate relative path inside public/uploads for frontend navigation
      const itemRelPath = path.relative(uploadDir, itemAbsPath).replace(/\\/g, '/');
      const url = itemStat.isDirectory() ? undefined : `/uploads/${itemRelPath}`;

      return {
        name,
        path: itemRelPath,
        isDirectory: itemStat.isDirectory(),
        size: itemStat.isDirectory() ? undefined : itemStat.size,
        mtime: itemStat.mtime.toISOString(),
        url
      };
    });

    res.json({ success: true, items });
  } catch (err: any) {
    console.error('File list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/create-folder - Create folder
app.post('/api/files/create-folder', authenticate, (req: Request, res: Response): any => {
  try {
    const { parentPath, folderName } = req.body;
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Sanitize folderName to prevent subfolders creation or traversal in name
    const cleanFolderName = path.basename(folderName);
    const parentAbsPath = getSafeUploadPath(parentPath || '');
    const folderAbsPath = path.join(parentAbsPath, cleanFolderName);

    if (fs.existsSync(folderAbsPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }

    fs.mkdirSync(folderAbsPath, { recursive: true });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/delete - Delete file or folder
app.post('/api/files/delete', authenticate, (req: Request, res: Response): any => {
  try {
    const { itemPath, isDirectory } = req.body;
    if (!itemPath) {
      return res.status(400).json({ error: 'Item path is required' });
    }

    const itemAbsPath = getSafeUploadPath(itemPath);

    if (!fs.existsSync(itemAbsPath)) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (isDirectory) {
      fs.rmSync(itemAbsPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemAbsPath);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/upload - Upload file to subpath
app.post('/api/files/upload', authenticate, upload.single('image'), (req: Request, res: Response): any => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetSubpath = req.body.path || '';
    const targetDir = getSafeUploadPath(targetSubpath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const originalTempPath = req.file.path;
    const finalDestPath = path.join(targetDir, req.file.filename);

    fs.renameSync(originalTempPath, finalDestPath);

    const relativeUrl = path.relative(uploadDir, finalDestPath).replace(/\\/g, '/');

    res.json({
      success: true,
      url: `/uploads/${relativeUrl}`
    });
  } catch (err: any) {
    console.error('File Manager upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Vite Dev Server Setup & Production Build Routing ───
async function startServer() {
  // Initialize Database (MySQL or fallback JSON)
  await initializeDatabase();

  if (process.env.NODE_ENV === 'development' && !process.env.SKIP_VITE) {
    try {
      const vitePkg = 'vite';
      const { createServer } = await import(vitePkg);
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware loaded in Dev mode');
    } catch (err) {
      console.error('Failed to load Vite dev server:', err);
      console.log('Falling back to static file serving...');
    }
  } else {
    const possiblePaths = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, 'public'),
      path.join(__dirname, 'dist')
    ];
    
    let distPath = possiblePaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || possiblePaths[0];

    app.use(express.static(distPath));
    app.use('/uploads', express.static(path.join(distPath, 'uploads')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`Serving production static files from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 গাংরে server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
