require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const { JOB_UPLOAD_DIR } = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) throw new Error('SESSION_SECRET is required');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use('/images/jobs', express.static(JOB_UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes    = require('./routes/auth');
const jobRoutes     = require('./routes/jobs');
const adminRoutes   = require('./routes/admin');
const reviewRoutes  = require('./routes/reviews');

app.use('/api/auth',    authRoutes);
app.use('/api/jobs',    jobRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Page routes
app.get('/',                  (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/services',          (req, res) => res.sendFile(path.join(__dirname, 'public', 'services.html')));
app.get('/gallery',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'gallery.html')));
app.get('/about',             (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/admin/login',       (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-login.html')));
app.get('/admin/dashboard',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')));
app.get('/review/:token',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'review.html')));

app.listen(PORT, () => {
  console.log(`JJG Carpentry server running on http://localhost:${PORT}`);
});