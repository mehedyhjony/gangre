-- Gangre Database Schema & Initial Data for cPanel (MySQL/MariaDB)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS sliders (
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
);

CREATE TABLE IF NOT EXISTS brands (
  brand_id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS models (
  model_id VARCHAR(50) PRIMARY KEY,
  brand_id VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  base_ram INT NOT NULL DEFAULT 4,
  base_rom INT NOT NULL DEFAULT 64,
  is_active INT NOT NULL DEFAULT 1
);

DROP TABLE IF EXISTS deductions;
CREATE TABLE deductions (
  deduction_key VARCHAR(50) PRIMARY KEY,
  value DECIMAL(5, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS site_config (
  id INT PRIMARY KEY,
  water_penalty DECIMAL(5, 2) NOT NULL DEFAULT 0.50,
  floor_price INT NOT NULL DEFAULT 300,
  chinese_min_price INT NOT NULL DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS content_sections (
  section_key VARCHAR(50) PRIMARY KEY,
  content_json LONGTEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faq (
  id INT PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0,
  keywords_json TEXT NOT NULL,
  reply TEXT NOT NULL,
  quick_replies_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  image_url VARCHAR(500),
  is_active INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
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
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL,
  sender VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  image_url VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at VARCHAR(50) NOT NULL
);

-- Insert Default Admin User (passcode is 'admin123' hashed with bcrypt)
INSERT INTO users (id, username, password_hash, role) 
VALUES (1, 'admin', '$2a$10$U.9vLgM22.M5KbeDsn9Nkuw89xGzD3t65p8K4vC979f8U54fFqW8S', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert Sliders
INSERT INTO sliders (id, sort_order, image_url, eye_text, title_line1, title_line2, description, price_tag1, price_tag2, bg_color, is_active)
VALUES (1, 0, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600', 'ঈদ ধামাকা অফার', 'আপনার পুরনো ভাঙা ফোন', 'বিক্রি করুন সঠিক মূল্যে', 'গাংরে-তে পুরনো, ডিসপ্লে ভাঙা বা ডেড ফোন বিক্রি করুন সবচেয়ে সহজে। ফ্রি হোম পিকআপ এবং সাথে সাথে ক্যাশ পেমেন্ট!', '৳ সর্বোচ্চ দাম', 'ফ্রি পিকআপ', '#e8f5e9,#f0fdf4', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Insert Brands
INSERT INTO brands (brand_id, label, sort_order) VALUES 
('samsung', 'Samsung', 0),
('apple', 'Apple (iPhone)', 1),
('xiaomi', 'Xiaomi / Redmi', 2)
ON DUPLICATE KEY UPDATE brand_id=brand_id;

-- Insert Models
INSERT INTO models (model_id, brand_id, label, price, is_active) VALUES
('s23ultra', 'samsung', 'Galaxy S23 Ultra', 45000.00, 1),
('s22', 'samsung', 'Galaxy S22', 28000.00, 1),
('a54', 'samsung', 'Galaxy A54', 16000.00, 1),
('iphone14pro', 'apple', 'iPhone 14 Pro Max', 65000.00, 1),
('iphone13', 'apple', 'iPhone 13', 38000.00, 1),
('iphone11', 'apple', 'iPhone 11', 20000.00, 1),
('note12pro', 'xiaomi', 'Redmi Note 12 Pro', 12000.00, 1),
('mi11x', 'xiaomi', 'Mi 11X', 14000.00, 1)
ON DUPLICATE KEY UPDATE model_id=model_id;

-- Insert Deductions
INSERT INTO deductions (deduction_key, value) VALUES
('screen', 0.35),
('back', 0.08),
('front_camera', 0.10),
('back_camera', 0.12),
('battery', 0.12),
('charging', 0.06),
('speaker', 0.05),
('mic', 0.04),
('buttons', 0.05),
('fingerprint', 0.04),
('water_damage', 0.50),
('dead', 0.80)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Insert Site Config
INSERT INTO site_config (id, water_penalty, floor_price, chinese_min_price) VALUES (1, 0.50, 300, 1000)
ON DUPLICATE KEY UPDATE id=id;

-- Insert Initial Brands
INSERT INTO brands (brand_id, label, sort_order) VALUES
('samsung', 'Samsung', 0),
('apple', 'Apple (iPhone)', 1),
('xiaomi', 'Xiaomi / Redmi', 2),
('google', 'Google (Pixel)', 3),
('realme', 'Realme', 4),
('oppo', 'Oppo', 5),
('vivo', 'Vivo', 6),
('oneplus', 'OnePlus', 7)
ON DUPLICATE KEY UPDATE brand_id=brand_id;

-- Insert Initial Models
INSERT INTO models (model_id, brand_id, label, price, base_ram, base_rom, is_active) VALUES
('s23ultra', 'samsung', 'Galaxy S23 Ultra', 45000, 12, 256, 1),
('s22', 'samsung', 'Galaxy S22', 28000, 8, 128, 1),
('a54', 'samsung', 'Galaxy A54', 16000, 8, 128, 1),
('iphone14pro', 'apple', 'iPhone 14 Pro Max', 65000, 6, 256, 1),
('iphone13', 'apple', 'iPhone 13', 38000, 4, 128, 1),
('iphone11', 'apple', 'iPhone 11', 20000, 4, 64, 1),
('note12pro', 'xiaomi', 'Redmi Note 12 Pro', 12000, 8, 128, 1),
('mi11x', 'xiaomi', 'Mi 11X', 14000, 6, 128, 1)
ON DUPLICATE KEY UPDATE model_id=model_id;

-- Insert FAQ Replies
INSERT INTO faq (id, sort_order, keywords_json, reply, quick_replies_json) VALUES
(1, 0, '["দাম", "মূল্য", "কত", "rate", "price"]', 'দাম ব্র্যান্ড, মডেল ও অবস্থার উপর নির্ভর করে। ফর্ম পূরণ করে এস্টিমেট নিন অথবা ছবি পাঠান।', '["দাম জানতে চাই", "ফর্ম কোথায়?"]'),
(2, 1, '["পিকআপ", "নিয়ে", "pick", "হোম"]', 'হ্যাঁ, ঢাকার সব এলাকায় ফ্রি হোম পিকআপ আছে। টিকিট সাবমিট করলে তারিখ বেছে নিতে পারবেন।', '["পিকআপ বুক করব", "কতক্ষণ লাগে?"]'),
(3, 2, '["পেমেন্ট", "টাকা", "বিকাশ", "নগদ", "payment"]', 'বিকাশ, নগদ বা ক্যাশ — আপনার সুবিধামতো। চেক শেষে সাথে সাথে পেমেন্ট।', '["কীভাবে টাকা পাব?", "ঠিক আছে"]')
ON DUPLICATE KEY UPDATE id=id;

-- Insert Testimonials
INSERT INTO testimonials (id, name, message, rating, image_url, is_active, sort_order) VALUES
(1, 'রহিম মিয়া', 'আমার পুরনো Samsung ফোনটা বিক্রি করলাম। খুবই ভালো দাম পেয়েছি এবং সার্ভিস ছিল দ্রুত। সবার কাছে রেকমেন্ড করব!', 5, NULL, 1, 0),
(2, 'তাহমিদ আলম', 'পিকআপ ম্যান এসে আমার চোখের সামনে চেক করে নগদ টাকা দিয়ে ফোন নিয়ে গেল। কোনো হ্যাসেল নেই!', 5, NULL, 1, 1)
ON DUPLICATE KEY UPDATE id=id;

-- Insert Content Sections (represented as JSON string keys)
INSERT INTO content_sections (section_key, content_json) VALUES
('nav', '{"brand":"গাংরে","link1":"কেন ও কীভাবে","link2":"বিক্রি করুন"}'),
('hero', '{"kicker_title":"বিশ্বস্ত ফোন কেনা-বেচা","main_title":"পুরনো ফোন বিক্রি করুন, নগদ টাকা নিন","description":"ঘরে বসে ফ্রি পিকআপ · তাৎক্ষণিক পেমেন্ট · সেরা মার্কেট দাম","floor_text":"সর্বনিম্ন ৳৩০০ থেকে শুরু"}'),
('tp_cards', '[{"icon":"💰","title":"সেরা দাম","desc":"মার্কেটের সর্বোচ্চ মূল্য নিশ্চিত"},{"icon":"🚚","title":"ফ্রি পিকআপ","desc":"ঘরে বসে ফোন দিয়ে দিন"},{"icon":"⚡","title":"তাৎক্ষণিক টাকা","desc":"বিকাশ/নগদ/ক্যাশ — সাথে সাথে"},{"icon":"🔒","title":"১০০% নিরাপদ","desc":"ডাটা মুছে দিয়ে লেনদেন"}]'),
('form', '{"kicker":"মূল্য জানুন","title":"আপনার ফোনের দাম কত?","hint":"বিস্তারিত দিলে আরও সঠিক এস্টিমেট পাবেন","water":"পানিতে ভিজেছে?","brand_label":"ব্র্যান্ড","model_label":"মডেল","ram_label":"RAM","rom_label":"স্টোরেজ","est_label":"আনুমানিক দাম","est_note":"চূড়ান্ত দাম ফিজিক্যাল চেক পর নির্ধারিত হবে","name_label":"আপনার নাম","phone_label":"মোবাইল নম্বর","address_label":"ঠিকানা","submit_text":"টিকিট সাবমিট করুন"}'),
('safety', '{"kicker":"নিরাপত্তা","title":"আপনার ডাটা ও টাকা — দুটোই সুরক্ষিত","description":"আমরা ফ্যাক্টরি রিসেট করে ডাটা মুছে দিই। পেমেন্ট সম্পূর্ণ স্বচ্ছ। কোনো লুকানো চার্জ নেই।","btn1":"কেন আমাদের বিশ্বাস করবেন","btn2":"এখনই বিক্রি করুন"}'),
('cta', '{"kicker":"প্রস্তুত?","title":"আজই আপনার ফোন বিক্রি করুন","desc":"২ মিনিটে এস্টিমেট নিন, আজই পিকআপ বুক করুন।","btn1":"দাম জানুন","btn2":"হোয়াটসঅ্যাপে কথা বলুন"}'),
('footer', '{"brand":"গাংরে","tagline":"পুরনো ফোনের নতুন মূল্য","phone":"০১৯৮৭-৬৫৪৩২১","admin":"অ্যাডমিন প্যানেল","copyright":"© ২০২৬ গাংরে · সর্বস্বত্ব সংরক্ষিত"}'),
('chat', '{"title":"লাইভ চ্যাট","hello":"স্বাগতম! কীভাবে সাহায্য করতে পারি? 😊","placeholder":"বার্তা লিখুন..."}')
ON DUPLICATE KEY UPDATE section_key=section_key;
