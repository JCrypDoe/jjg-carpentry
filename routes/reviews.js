const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { requireAuth } = require('../middleware/auth');
const { DATA_DIR } = require('../storage');

const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');

// ── Data helpers ──
function loadReviews() {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8')); } catch { return []; }
}
function saveReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}
function loadJobs() {
  if (!fs.existsSync(JOBS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')); } catch { return []; }
}
function saveJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}
function loadCustomers() {
  if (!fs.existsSync(CUSTOMERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8')); } catch { return []; }
}
function saveCustomers(customers) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

// ── Email transporter ──
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ── SMS via Twilio ──
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('AC') === false || token === 'your_twilio_auth_token') return null;
  try {
    const twilio = require('twilio');
    return twilio(sid, token);
  } catch { return null; }
}

// ── Build review email HTML ──
function buildReviewEmailHTML(job, reviewToken, customerName) {
  const reviewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/review/${reviewToken}`;
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 40px 32px; text-align: center; }
  .logo { display: inline-block; background: linear-gradient(135deg, #c9a84c, #e0c06a); border-radius: 12px; padding: 10px 20px; font-size: 22px; font-weight: 900; color: #0a1628; letter-spacing: 1px; margin-bottom: 16px; }
  .header h1 { color: #fff; font-size: 24px; margin: 0; }
  .header p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0 0; }
  .body { padding: 36px 32px; }
  .greeting { font-size: 18px; font-weight: 700; color: #0a1628; margin-bottom: 12px; }
  .message { font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 24px; }
  .job-card { background: #f8f6f0; border: 1px solid #e8d9b0; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
  .job-card-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c9a84c; margin-bottom: 6px; }
  .job-card-title { font-size: 17px; font-weight: 700; color: #0a1628; }
  .job-card-cat { font-size: 13px; color: #888; margin-top: 4px; }
  .stars-row { display: flex; justify-content: center; gap: 8px; margin: 24px 0; }
  .star-btn {
    display: inline-block; width: 56px; height: 56px; line-height: 56px;
    background: #f4f4f4; border-radius: 50%; font-size: 28px; text-align: center;
    text-decoration: none; transition: background 0.2s;
  }
  .star-1 { background: #fff3cd; }
  .star-2 { background: #ffeaa7; }
  .star-3 { background: #fdcb6e; }
  .star-4 { background: #e17055; }
  .star-5 { background: #00b894; }
  .cta-btn {
    display: block; width: fit-content; margin: 0 auto 24px;
    background: linear-gradient(135deg, #c9a84c, #e0c06a);
    color: #0a1628; font-weight: 800; font-size: 16px;
    padding: 16px 40px; border-radius: 50px; text-decoration: none;
    text-align: center;
  }
  .or-text { text-align: center; font-size: 13px; color: #aaa; margin: 12px 0; }
  .review-link { text-align: center; font-size: 12px; color: #aaa; word-break: break-all; }
  .review-link a { color: #c9a84c; }
  .footer { background: #0a1628; padding: 24px 32px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0; }
  .footer a { color: #c9a84c; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">JJG</div>
    <h1>How did we do?</h1>
    <p>Your feedback means the world to us</p>
  </div>
  <div class="body">
    <div class="greeting">Hi ${customerName || 'there'}! 👋</div>
    <div class="message">
      Thank you for choosing <strong>JJG Carpentry LLC</strong>! We recently completed a job for you and we'd love to hear how it went. Your honest review helps us improve and helps other South Florida homeowners find reliable service.
    </div>
    <div class="job-card">
      <div class="job-card-label">Completed Job</div>
      <div class="job-card-title">${job.title}</div>
      <div class="job-card-cat">${job.category} · ${new Date(job.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
    <p style="text-align:center;font-size:15px;color:#555;margin-bottom:16px;">Tap a star to leave your rating:</p>
    <div class="stars-row">
      <a href="${reviewUrl}?rating=1" class="star-btn star-1" title="1 Star">⭐</a>
      <a href="${reviewUrl}?rating=2" class="star-btn star-2" title="2 Stars">⭐⭐</a>
      <a href="${reviewUrl}?rating=3" class="star-btn star-3" title="3 Stars">⭐⭐⭐</a>
      <a href="${reviewUrl}?rating=4" class="star-btn star-4" title="4 Stars">⭐⭐⭐⭐</a>
      <a href="${reviewUrl}?rating=5" class="star-btn star-5" title="5 Stars">⭐⭐⭐⭐⭐</a>
    </div>
    <div class="or-text">— or —</div>
    <a href="${reviewUrl}" class="cta-btn">✍️ Write a Full Review</a>
    <div class="review-link">
      Or copy this link: <a href="${reviewUrl}">${reviewUrl}</a>
    </div>
  </div>
  <div class="footer">
    <p><strong style="color:#c9a84c;">JJG Carpentry LLC</strong></p>
    <p>📞 <a href="tel:+13055550100">(305) 555-0100</a> · ✉️ <a href="mailto:info@jjgcarpentry.com">info@jjgcarpentry.com</a></p>
    <p style="margin-top:12px;">Miami-Dade & Broward County, FL</p>
    <p style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.3);">You received this because JJG Carpentry LLC completed a job for you. <a href="${reviewUrl}/unsubscribe" style="color:rgba(255,255,255,0.3);">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

// ── Build SMS message ──
function buildSMSMessage(job, reviewToken, customerName) {
  const reviewUrl = `${process.env.APP_URL || 'http://localhost:3000'}/review/${reviewToken}`;
  return `Hi ${customerName || 'there'}! 👋 JJG Carpentry LLC just completed your ${job.category} job: "${job.title}". We'd love your feedback! Rate us 1-5 stars here: ${reviewUrl} — Thank you! 🙏`;
}

// ── POST /api/reviews/request — Admin sends review request ──
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { jobId, customerName, customerEmail, customerPhone, sendVia } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId required' });
    if (!sendVia || sendVia.length === 0) return res.status(400).json({ success: false, message: 'Select at least one delivery method' });
    if (sendVia.includes('email') && !customerEmail) return res.status(400).json({ success: false, message: 'Email address required for email delivery' });
    if (sendVia.includes('sms') && !customerPhone) return res.status(400).json({ success: false, message: 'Phone number required for SMS delivery' });

    const jobs = loadJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const customerParts = (customerName || '').trim().split(/\s+/);
    const firstName = customerParts.shift() || '';
    const lastName = customerParts.join(' ');
    let customerId = job.customerId || null;
    if (customerEmail || customerPhone) {
      const customers = loadCustomers();
      const normalizedEmail = (customerEmail || '').trim().toLowerCase();
      const phoneDigits = (customerPhone || '').replace(/\D/g, '');
      let customer = customers.find(item => normalizedEmail && item.email?.toLowerCase() === normalizedEmail);
      if (!customer && phoneDigits) customer = customers.find(item => item.phone?.replace(/\D/g, '') === phoneDigits);
      const now = new Date().toISOString();
      if (customer) {
        customer.firstName = firstName || customer.firstName;
        customer.lastName = lastName || customer.lastName;
        customer.email = normalizedEmail || customer.email;
        customer.phone = (customerPhone || '').trim() || customer.phone;
        customer.updatedAt = now;
      } else {
        customer = {
          id: uuidv4(), firstName, lastName, email: normalizedEmail,
          phone: (customerPhone || '').trim(), createdAt: now, updatedAt: now
        };
        customers.unshift(customer);
      }
      customerId = customer.id;
      saveCustomers(customers);
    }

    // Create review token
    const reviewToken = uuidv4();
    const reviews = loadReviews();

    // Check if review request already exists for this job
    const existing = reviews.find(r => r.jobId === jobId && r.status === 'pending');
    if (existing) {
      return res.status(400).json({ success: false, message: 'A review request is already pending for this job.' });
    }

    const reviewEntry = {
      id: uuidv4(),
      jobId,
      jobTitle: job.title,
      jobCategory: job.category,
      jobDate: job.date,
      reviewToken,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      sendVia,
      status: 'pending',
      rating: null,
      reviewText: '',
      requestedAt: new Date().toISOString(),
      submittedAt: null,
      emailSent: false,
      smsSent: false,
      emailError: null,
      smsError: null
    };

    const results = { email: null, sms: null };

    // ── Send Email ──
    if (sendVia.includes('email') && customerEmail) {
      try {
        if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
          // Demo mode — log instead of send
          console.log('[EMAIL DEMO] Would send review request to:', customerEmail);
          console.log('[EMAIL DEMO] Review URL:', `${process.env.APP_URL || 'http://localhost:3000'}/review/${reviewToken}`);
          reviewEntry.emailSent = true;
          results.email = 'demo';
        } else {
          const transporter = createTransporter();
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'JJG Carpentry LLC <noreply@jjgcarpentry.com>',
            to: customerEmail,
            subject: `How did we do? Leave a review for JJG Carpentry LLC ⭐`,
            html: buildReviewEmailHTML(job, reviewToken, customerName)
          });
          reviewEntry.emailSent = true;
          results.email = 'sent';
        }
      } catch (err) {
        reviewEntry.emailError = err.message;
        results.email = 'failed';
        console.error('[EMAIL ERROR]', err.message);
      }
    }

    // ── Send SMS ──
    if (sendVia.includes('sms') && customerPhone) {
      try {
        const client = getTwilioClient();
        if (!client) {
          // Demo mode
          console.log('[SMS DEMO] Would send SMS to:', customerPhone);
          console.log('[SMS DEMO] Message:', buildSMSMessage(job, reviewToken, customerName));
          reviewEntry.smsSent = true;
          results.sms = 'demo';
        } else {
          await client.messages.create({
            body: buildSMSMessage(job, reviewToken, customerName),
            from: process.env.TWILIO_PHONE,
            to: customerPhone
          });
          reviewEntry.smsSent = true;
          results.sms = 'sent';
        }
      } catch (err) {
        reviewEntry.smsError = err.message;
        results.sms = 'failed';
        console.error('[SMS ERROR]', err.message);
      }
    }

    // Save review entry
    reviews.push(reviewEntry);
    saveReviews(reviews);

    // Update job with customer info
    const jobIdx = jobs.findIndex(j => j.id === jobId);
    if (jobIdx !== -1) {
      jobs[jobIdx].customerId = customerId;
      jobs[jobIdx].customerFirstName = firstName;
      jobs[jobIdx].customerLastName = lastName;
      jobs[jobIdx].customerName = customerName || '';
      jobs[jobIdx].customerEmail = customerEmail || '';
      jobs[jobIdx].customerPhone = customerPhone || '';
      jobs[jobIdx].reviewRequested = true;
      jobs[jobIdx].reviewToken = reviewToken;
      saveJobs(jobs);
    }

    res.json({
      success: true,
      message: 'Review request sent!',
      reviewToken,
      reviewUrl: `${process.env.APP_URL || 'http://localhost:3000'}/review/${reviewToken}`,
      results
    });
  } catch (err) {
    console.error('[REVIEW REQUEST ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/reviews — Get all reviews (admin) ──
router.get('/', requireAuth, (req, res) => {
  const reviews = loadReviews();
  reviews.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  res.json({ success: true, reviews });
});

// ── GET /api/reviews/public — Get submitted reviews (public) ──
router.get('/public', (req, res) => {
  const reviews = loadReviews().filter(r => r.status === 'submitted' && r.rating && r.featured);
  reviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  // Sanitize for public
  const safe = reviews.map(r => ({
    id: r.id,
    jobTitle: r.jobTitle,
    jobCategory: r.jobCategory,
    customerName: r.customerName ? r.customerName.split(' ')[0] + (r.customerName.split(' ')[1] ? ' ' + r.customerName.split(' ')[1][0] + '.' : '') : 'Anonymous',
    rating: r.rating,
    reviewText: r.reviewText,
    submittedAt: r.submittedAt
  }));
  res.json({ success: true, reviews: safe });
});

// ── GET /api/reviews/token/:token — Get review by token (for submission page) ──
router.get('/token/:token', (req, res) => {
  const reviews = loadReviews();
  const review = reviews.find(r => r.reviewToken === req.params.token);
  if (!review) return res.status(404).json({ success: false, message: 'Review link not found or expired.' });
  if (review.status === 'submitted') return res.json({ success: true, alreadySubmitted: true, rating: review.rating });
  // Return safe subset
  res.json({
    success: true,
    alreadySubmitted: false,
    jobTitle: review.jobTitle,
    jobCategory: review.jobCategory,
    jobDate: review.jobDate,
    customerName: review.customerName
  });
});

// ── POST /api/reviews/submit/:token — Customer submits review ──
router.post('/submit/:token', (req, res) => {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.reviewToken === req.params.token);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review link not found or expired.' });
  if (reviews[idx].status === 'submitted') return res.status(400).json({ success: false, message: 'You have already submitted a review.' });

  const { rating, reviewText, customerName } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Please provide a rating between 1 and 5.' });

  reviews[idx].rating = parseInt(rating);
  reviews[idx].reviewText = (reviewText || '').trim().substring(0, 1000);
  reviews[idx].status = 'submitted';
  reviews[idx].submittedAt = new Date().toISOString();
  if (customerName && !reviews[idx].customerName) reviews[idx].customerName = customerName;

  saveReviews(reviews);
  res.json({ success: true, message: 'Thank you for your review!' });
});

// ── DELETE /api/reviews/:id — Admin delete review ──
router.delete('/:id', requireAuth, (req, res) => {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found' });
  reviews.splice(idx, 1);
  saveReviews(reviews);
  res.json({ success: true, message: 'Review deleted' });
});

// ── PUT /api/reviews/:id/approve — Admin approve/feature review ──
router.put('/:id/approve', requireAuth, (req, res) => {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Review not found' });
  reviews[idx].featured = !reviews[idx].featured;
  saveReviews(reviews);
  res.json({ success: true, featured: reviews[idx].featured });
});

// ── POST /api/reviews/resend/:id — Resend review request ──
router.post('/resend/:id', requireAuth, async (req, res) => {
  const reviews = loadReviews();
  const review = reviews.find(r => r.id === req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  if (review.status === 'submitted') return res.status(400).json({ success: false, message: 'Review already submitted' });

  const jobs = loadJobs();
  const job = jobs.find(j => j.id === review.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const results = {};

  if (review.sendVia.includes('email') && review.customerEmail) {
    try {
      if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
        console.log('[EMAIL DEMO RESEND] To:', review.customerEmail);
        results.email = 'demo';
      } else {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: review.customerEmail,
          subject: `Reminder: Leave a review for JJG Carpentry LLC ⭐`,
          html: buildReviewEmailHTML(job, review.reviewToken, review.customerName)
        });
        results.email = 'sent';
      }
    } catch (err) { results.email = 'failed'; }
  }

  if (review.sendVia.includes('sms') && review.customerPhone) {
    try {
      const client = getTwilioClient();
      if (!client) {
        console.log('[SMS DEMO RESEND] To:', review.customerPhone);
        results.sms = 'demo';
      } else {
        await client.messages.create({
          body: buildSMSMessage(job, review.reviewToken, review.customerName),
          from: process.env.TWILIO_PHONE,
          to: review.customerPhone
        });
        results.sms = 'sent';
      }
    } catch (err) { results.sms = 'failed'; }
  }

  res.json({ success: true, message: 'Review request resent!', results });
});

module.exports = router;