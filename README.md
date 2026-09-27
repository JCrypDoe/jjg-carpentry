# JJG Carpentry LLC — Full-Stack Website

A complete multi-page handyman website with Node.js backend, admin dashboard, image upload workflow, and public job gallery.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd jjg-carpentry
npm install
```

### 2. Configure Environment
Edit `.env` to set your admin credentials:
```env
PORT=3000
JWT_SECRET=your_super_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt hash of your password>
SESSION_SECRET=your_session_secret_here
```

**Generate a password hash:**
```bash
node -e "const b=require('bcryptjs');b.hash('YourPassword123',10).then(h=>console.log(h))"
```

### 3. Start the Server
```bash
node server.js
```

Visit: http://localhost:3000

---

## 📁 Project Structure

```
jjg-carpentry/
├── server.js              # Main Express server
├── .env                   # Environment config (DO NOT commit)
├── package.json
├── routes/
│   ├── auth.js            # Login / logout / verify
│   ├── jobs.js            # Public job API
│   └── admin.js           # Protected admin API (upload/edit/delete)
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── data/
│   └── jobs.json          # Job metadata storage
└── public/
    ├── index.html         # Home page
    ├── services.html      # Services page
    ├── gallery.html       # Gallery page (auto-loads from API)
    ├── about.html         # About page
    ├── contact.html       # Contact + Quote form
    ├── admin-login.html   # Admin login
    ├── admin-dashboard.html # Admin dashboard
    ├── css/
    │   └── style.css      # Full stylesheet
    ├── js/
    │   └── main.js        # Shared JavaScript
    └── images/
        ├── icons/         # SVG service icons
        ├── banners/       # SVG hero & section banners
        └── jobs/          # Uploaded job photos
            └── thumbs/    # Auto-generated thumbnails
```

---

## 🔐 Admin Access

| URL | Description |
|-----|-------------|
| `/admin/login` | Admin login page |
| `/admin/dashboard` | Dashboard (requires login) |

There are no built-in default credentials. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, and `SESSION_SECRET` in your ignored `.env` file before starting the server. The local demo password is weak; use a longer, unique password before sharing the admin login publicly.

---

## 🌐 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Get all jobs |
| GET | `/api/jobs?category=Carpentry` | Filter by category |
| GET | `/api/jobs/:id` | Get single job |

### Protected (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify` | Verify token |
| GET | `/api/admin/jobs` | Get all jobs (admin) |
| POST | `/api/admin/upload` | Upload job photo |
| PUT | `/api/admin/jobs/:id` | Update job |
| DELETE | `/api/admin/jobs/:id` | Delete job |

---

## 🎨 Service Categories

- 🪚 Carpentry
- 🔧 Plumbing
- ⚡ Electrical
- 🎨 Painting
- 🏠 Roofing
- 💧 Pressure Cleaning
- 🧱 Drywall
- 🚚 Delivery

---

## 🚢 Deployment

### Option A: Railway (Recommended — Full Stack)
1. Push the project to GitHub. Keep `.env` and customer data out of the repository.
2. In [Railway](https://railway.app), create a project from the GitHub repository. If this app is in a monorepo, set the service Root Directory to `jjg-carpentry`.
3. Set the service start command to `npm start`.
4. Add a Railway Volume to the service and set its mount path to `/var/data`.
5. Add the environment variables below in the Railway service settings. Use a newly generated long password for the public admin login.
6. Deploy the service, generate a public domain, then set `APP_URL` to that HTTPS domain and redeploy.

```env
DATA_DIR=/var/data/data
JOB_UPLOAD_DIR=/var/data/jobs
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt hash of a strong password>
JWT_SECRET=<new random secret>
SESSION_SECRET=<a different new random secret>
APP_URL=https://your-service-name.up.railway.app
```

### Option B: Render
1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Set the Root Directory to `jjg-carpentry` if the app is inside a larger repository.
4. Build command: `npm install`; start command: `npm start`.
5. Add a persistent disk mounted at `/var/data` (paid Render service required).
6. Set `DATA_DIR=/var/data/data` and `JOB_UPLOAD_DIR=/var/data/jobs` so customer/job/review JSON and uploaded photos persist across deploys.
7. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `SESSION_SECRET`, and `APP_URL` in the Render environment. Never commit `.env` or customer data.

### Persistent Storage Configuration

The app uses `DATA_DIR` for `jobs.json`, `customers.json`, and `reviews.json`, and `JOB_UPLOAD_DIR` for uploaded job photos and thumbnails. Both default to local project folders. For a Railway Volume or Render disk mounted at `/var/data`, set:

```env
DATA_DIR=/var/data/data
JOB_UPLOAD_DIR=/var/data/jobs
APP_URL=https://your-service-domain
```

The GitHub repository intentionally excludes local JSON records and uploaded job photos. A new hosted volume starts empty; transfer existing jobs and customer records separately or re-upload them through the admin dashboard. Public job APIs omit customer contact details.

Keep `.env` and customer records private. The requested `JJG2026` password is suitable only for a private test; choose a longer, unique password before sharing the live admin login.

### Option C: VPS (DigitalOcean / Linode)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd jjg-carpentry
npm install
cp .env.example .env
nano .env  # Edit credentials

# Run with PM2
npm install -g pm2
pm2 start server.js --name jjg-carpentry
pm2 startup
pm2 save

# Nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy port 80 → 3000
```

### Option D: Frontend Only (Netlify)
For static hosting only (no upload functionality):
1. Deploy `public/` folder to Netlify
2. Gallery will show empty state until backend is connected
3. Use Netlify Functions for serverless backend

---

## 🔧 Customization

### Update Contact Info
Search and replace in all HTML files:
- `(305) 555-0100` → Your phone number
- `info@jjgcarpentry.com` → Your email
- `Miami-Dade & Broward County` → Your service area

### Update Branding
- Colors: Edit CSS variables in `public/css/style.css` (`:root` block)
- Logo: Replace `JJG` text in nav with your logo image
- Fonts: Change Google Fonts import in CSS

### Add Real Images
Replace SVG banners in `public/images/banners/` with real photos:
- `hero-banner.svg` → Hero background photo
- `team-photo.svg` → Team photo

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express |
| Auth | JWT + bcryptjs |
| Storage | JSON file + local filesystem |
| Images | Multer + Sharp (thumbnails) |
| Fonts | Google Fonts (Montserrat + Open Sans) |
| Icons | Font Awesome 6 |

---

## 📞 Support

JJG Carpentry LLC  
📞 (305) 555-0100  
✉️ info@jjgcarpentry.com  
📍 Miami-Dade & Broward County, FL