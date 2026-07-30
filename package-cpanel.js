import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const TEMP_DIR = path.join(ROOT, 'gangre-cpanel');

console.log('🚀 Starting Gangre cPanel Packaging Pipeline...');

try {
  // 1. Run standard production build
  console.log('📦 Step 1: Compiling application and bundling server...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Clean/Create temp directory
  console.log('📁 Step 2: Preparing clean directory structure...');
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR);
  fs.mkdirSync(path.join(TEMP_DIR, 'public'));
  fs.mkdirSync(path.join(TEMP_DIR, 'public', 'uploads'));

  // 3. Copy compiled web assets to public/
  console.log('💻 Step 3: Copying frontend built assets...');
  const distPath = path.join(ROOT, 'dist');
  
  const copyFolderRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyFolderRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  // Copy everything except server.cjs and map files if present
  const distEntries = fs.readdirSync(distPath, { withFileTypes: true });
  for (const entry of distEntries) {
    const srcPath = path.join(distPath, entry.name);
    const destPath = path.join(TEMP_DIR, 'public', entry.name);
    
    if (entry.name === 'server.cjs' || entry.name === 'server.cjs.map') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // 4. Copy bundled server CJS file to server.js in root
  console.log('🖥️ Step 4: Placing server.js entrypoint in root...');
  fs.copyFileSync(path.join(distPath, 'server.cjs'), path.join(TEMP_DIR, 'server.js'));

  // 5. Build cPanel-optimized package.json
  console.log('📋 Step 5: Generating cPanel-optimized package.json...');
  const originalPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  
  const productionPkg = {
    name: "gangre-cpanel",
    version: "1.0.0",
    private: true,
    // Change type to commonjs since the bundled server is fully compiled CommonJS CJS format
    type: "commonjs",
    main: "server.js",
    scripts: {
      start: "node server.js"
    },
    dependencies: {
      "express": originalPkg.dependencies.express || "^4.21.2",
      "cors": originalPkg.dependencies.cors || "^2.8.6",
      "mysql2": originalPkg.dependencies.mysql2 || "^3.12.0",
      "dotenv": originalPkg.dependencies.dotenv || "^17.2.3",
      "bcryptjs": originalPkg.dependencies.bcryptjs || "^3.0.3",
      "jsonwebtoken": originalPkg.dependencies.jsonwebtoken || "^9.0.3",
      "multer": originalPkg.dependencies.multer || "^2.2.0"
    }
  };
  
  fs.writeFileSync(
    path.join(TEMP_DIR, 'package.json'), 
    JSON.stringify(productionPkg, null, 2), 
    'utf-8'
  );

  // 6. Setup configured .env
  console.log('🔑 Step 6: Creating default environment configuration...');
  const envContent = `# Gangre cPanel Production Environment Variables

# JWT Authentication Key (Keep this secret and secure!)
JWT_SECRET="GangreBd2026SuperSecretKey@!"

# MySQL Database Configuration
# Fill this out to connect Gangre to your live cPanel MySQL Database.
# If empty, the app will automatically fall back to db.json!
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME=""
DB_USER=""
DB_PASS=""
`;
  fs.writeFileSync(path.join(TEMP_DIR, '.env'), envContent, 'utf-8');

  // 7. Copy SQL Schema
  console.log('🗄️ Step 7: Adding MySQL database SQL script...');
  if (fs.existsSync(path.join(ROOT, 'gangre.sql'))) {
    fs.copyFileSync(path.join(ROOT, 'gangre.sql'), path.join(TEMP_DIR, 'gangre.sql'));
  }

  // 8. Copy default db.json
  console.log('📁 Step 8: Embedding fallback JSON database db.json...');
  if (fs.existsSync(path.join(ROOT, 'db.json'))) {
    fs.copyFileSync(path.join(ROOT, 'db.json'), path.join(TEMP_DIR, 'db.json'));
  }

  // 9. Add Instructions
  console.log('📝 Step 9: Adding deployment instructions...');
  const instructions = `GANGRE CPANEL DEPLOYMENT GUIDE
===============================

1. CREATE DATABASE:
   - Go to cPanel > MySQL Databases.
   - Create a new database (e.g., gangre_db).
   - Create a user and add it to the database with ALL PRIVILEGES.

2. IMPORT SQL:
   - Go to phpMyAdmin.
   - CLICK on your new database name in the left sidebar (CRITICAL: You must select the database first!).
   - Click "Import" tab at the top.
   - Choose 'gangre.sql' from this folder and click Go.

3. CONFIGURE .ENV:
   - Open '.env' file in this folder.
   - Fill in DB_NAME, DB_USER, and DB_PASS with the details you just created.
   - Change JWT_SECRET to something unique for your security.

4. NODE.JS SETUP:
   - Go to cPanel > Setup Node.js App.
   - Create Application.
   - Node.js version: 18 or higher (20 recommended).
   - Application mode: production.
   - Application root: (the folder where you extracted this zip).
   - Application URL: your domain.
   - Application startup file: server.js.
   - TROUBLESHOOTING ENV ERRORS: 
     - If you see "export: \`=localhost': not a valid identifier", it means you likely put 
       "DB_HOST=localhost" inside the **Name** field in cPanel.
     - CORRECT WAY in cPanel "Setup Node.js App" -> Environment variables:
       - **Name**: DB_HOST
       - **Value**: localhost
       (Do NOT type the variable name again in the value field).
     - Also, ensure there are no empty environment variables at the end of the list.
   - Click "Run NPM Install" button.
   - Click "Restart" button.

5. UPLOADS:
   - Ensure the 'public/uploads' folder exists and is writable (it should be in the zip).

SUCCESS! Your app should now be live at your domain.
`;
  fs.writeFileSync(path.join(TEMP_DIR, 'INSTRUCTIONS.txt'), instructions, 'utf-8');

  // 10. Compress into ZIP file
  console.log('🤐 Step 10: Compressing into gangre.zip...');
  const zipPath = path.join(ROOT, 'public', 'gangre.zip');
  
  // Clean old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Use Python 3 to compress to gangre.zip inside public/ directory
  execSync(`python3 -m zipfile -c ${zipPath} .`, { cwd: TEMP_DIR, stdio: 'inherit' });
  console.log(`✅ Success! Created gangre.zip inside public/ directory.`);

  // 10. Cleanup
  console.log('🧹 Step 10: Cleaning up temporary assets...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  
  console.log('\n🌟 CONGRATULATIONS! ALL STEPS COMPLETED SUCCESSFULLY.');
  console.log(`🎁 Your live cPanel-ready file is located at: /public/gangre.zip`);
  console.log('ℹ️ You can now download and extract this zip straight on your live server!');

} catch (err) {
  console.error('❌ Pipeline failed with error:', err);
  process.exit(1);
}
