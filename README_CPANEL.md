# How to host Gangre on cPanel Shared Hosting (PHP Version)

Since your hosting has limits on Node.js/SSH, we will use a **PHP Backend** and a **Static React Frontend**.

## Troubleshooting 503 Service Unavailable
If you see a **503 Error** when visiting your site or `setup.php`:
1. **Wrong Credentials**: If `api.php` or `setup.php` has the wrong database username/password, the script might "hang" while trying to connect, which uses up your server's "Entry Processes". Double-check your details!
2. **Kill Hanging Processes**: Go to cPanel -> **Select PHP Version** -> **Extensions**. Make sure `opcache` is enabled. If you have a "Kill Processes" button, use it.
3. **Wait 5-10 Minutes**: Sometimes the host blocks your IP for a few minutes if you hit limits. 
4. **PHP Version**: Ensure you are using **PHP 8.1 or 8.2** in cPanel.

### How to Test & Fix Resource Limits
1. **Ping Test**: Visit `https://yourdomain.com/api/ping`
   - If this works, PHP is alive. If this fails with 503, you have too many "Entry Processes" hanging in cPanel.
2. **Database Test**: Visit `https://yourdomain.com/api/data`
   - If this fails but the Ping works, your database credentials are wrong or the database server is slow.
3. **CageFS Error**: If you see "Unable to fork", go to cPanel -> **CPU and Concurrent Connection Usage** and look for any red lines. Click "Snapshot" to see what is running.

## 1. Prepare your files
1. Build your frontend in AI Studio (it happens automatically when you see the preview).
2. Download the project or export the `dist/` folder.
3. You will need these files:
   - All files inside the `dist/` folder (index.html, assets, etc.)
   - `api.php`
   - `setup.php`
   - `.htaccess`

## 2. Upload to cPanel
1. Log in to cPanel and open **File Manager**.
2. Go to `public_html`.
3. Upload everything inside the `dist/` folder directly into `public_html`.
4. Upload `api.php`, `setup.php`, and `.htaccess` into `public_html`.

### Recommended Directory Structure Layout
After uploading, your `public_html` should look like this:
```text
public_html/
├── assets/              (Contains your JS, CSS, and images from the build)
├── uploads/             (Created automatically when you upload your first image)
├── .htaccess            (Handles routing for React and the PHP API)
├── index.html           (The main entry point for your website)
├── api.php              (The PHP backend logic)
├── setup.php            (Run once, then delete)
├── favicon.ico          (Your site icon)
└── (other build files like manifest.json, robots.txt, etc.)
```

## 3. Database Setup
1. In cPanel, go to **MySQL® Databases**.
2. Create a new database (e.g., `gangrebd_db`).
3. Create a new database user and set a password.
4. Add the user to the database with **All Privileges**.
5. **CRITICAL**: Edit `api.php` and `setup.php` on your server using the File Manager and update these lines with your real details:
   ```php
   $db_host = 'localhost';
   $db_user = 'your_cpanel_user';
   $db_pass = 'your_database_password';
   $db_name = 'your_cpanel_db_name';
   ```

## 4. Initialize Database
1. Open your browser and go to: `https://yourdomain.com/setup.php`
2. You should see "Setup complete!".
3. **IMPORTANT**: Delete `setup.php` from your File Manager after this.

## 5. Usage
- Your website is now live!
- The API is handled by `api.php` via the `.htaccess` rules.
- Admin login: `admin` / `admin123` (You can change these in `api.php`).
- Image uploads will go to a folder named `uploads/` automatically.

## Support
This PHP version is lightweight and uses very little memory, making it perfect for budget shared hosting.
