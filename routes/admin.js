const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { requireAuth } = require('../middleware/auth');
const { DATA_DIR, JOB_UPLOAD_DIR, THUMB_DIR } = require('../storage');

const DATA_FILE = path.join(DATA_DIR, 'jobs.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');

function loadJobs() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function saveJobs(jobs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

function loadCustomers() {
  if (!fs.existsSync(CUSTOMERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8')); }
  catch { return []; }
}

function saveCustomers(customers) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

function saveOrUpdateCustomer({ firstName, lastName, email, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  if (!normalizedEmail && !normalizedPhone) return null;

  const customers = loadCustomers();
  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  let customer = customers.find(item => normalizedEmail && item.email?.toLowerCase() === normalizedEmail);
  if (!customer && phoneDigits) {
    customer = customers.find(item => item.phone?.replace(/\D/g, '') === phoneDigits);
  }

  const now = new Date().toISOString();
  if (customer) {
    customer.firstName = firstName || customer.firstName;
    customer.lastName = lastName || customer.lastName;
    customer.email = normalizedEmail || customer.email;
    customer.phone = normalizedPhone || customer.phone;
    customer.updatedAt = now;
  } else {
    customer = {
      id: uuidv4(),
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      createdAt: now,
      updatedAt: now
    };
    customers.unshift(customer);
  }

  saveCustomers(customers);
  return customer;
}

router.get('/customers', requireAuth, (req, res) => {
  const customers = loadCustomers().sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );
  res.json({ success: true, customers });
});

router.post('/customers', requireAuth, (req, res) => {
  const firstName = (req.body.firstName || '').trim();
  const lastName = (req.body.lastName || '').trim();
  const email = (req.body.email || '').trim();
  const phone = (req.body.phone || '').trim();
  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'First and last name are required.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Enter an email address or phone number.' });
  }

  const customer = saveOrUpdateCustomer({ firstName, lastName, email, phone });
  res.status(201).json({ success: true, customer });
});

router.put('/customers/:id', requireAuth, (req, res) => {
  const customers = loadCustomers();
  const customer = customers.find(item => item.id === req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

  const firstName = (req.body.firstName || '').trim();
  const lastName = (req.body.lastName || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const phone = (req.body.phone || '').trim();
  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'First and last name are required.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Enter an email address or phone number.' });
  }
  const duplicate = customers.find(item => item.id !== customer.id && (
    (email && item.email?.toLowerCase() === email) ||
    (phone && item.phone?.replace(/\D/g, '') === phone.replace(/\D/g, ''))
  ));
  if (duplicate) return res.status(409).json({ success: false, message: 'A customer with that email or phone already exists.' });

  Object.assign(customer, { firstName, lastName, email, phone, updatedAt: new Date().toISOString() });
  saveCustomers(customers);
  res.json({ success: true, customer });
});

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, JOB_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// GET all jobs (admin view)
router.get('/jobs', requireAuth, (req, res) => {
  const jobs = loadJobs();
  res.json({ success: true, jobs });
});

// POST upload new job
router.post('/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const { title, description, category, date } = req.body;
    if (!title || !category) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Title and category required' });
    }

    const legacyName = (req.body.customerName || '').trim().split(/\s+/);
    const customer = saveOrUpdateCustomer({
      firstName: (req.body.customerFirstName || legacyName.shift() || '').trim(),
      lastName: (req.body.customerLastName || legacyName.join(' ')).trim(),
      email: (req.body.customerEmail || '').trim(),
      phone: (req.body.customerPhone || '').trim()
    });

    const id = uuidv4();
    const filename = req.file.filename;
    const thumbFilename = `thumb_${filename}`;

    // Generate thumbnail
    await sharp(req.file.path)
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(path.join(THUMB_DIR, thumbFilename));

    const jobDate = date || new Date().toISOString().split('T')[0];

    const job = {
      id,
      title,
      description: description || '',
      category,
      date: jobDate,
      location: (req.body.location || '').trim(),
      ...(customer ? {
        customerId: customer.id,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        customerPhone: customer.phone
      } : {}),
      image_url: `/images/jobs/${filename}`,
      thumbnail_url: `/images/jobs/thumbs/${thumbFilename}`,
      created_at: new Date().toISOString()
    };

    const jobs = loadJobs();
    jobs.unshift(job);
    saveJobs(jobs);

    res.json({ success: true, job, message: 'Job uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update job
router.put('/jobs/:id', requireAuth, (req, res) => {
  const jobs = loadJobs();
  const idx = jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Job not found' });

  const { title, description, category, date } = req.body;
  if (title) jobs[idx].title = title;
  if (description !== undefined) jobs[idx].description = description;
  if (category) jobs[idx].category = category;
  if (date) jobs[idx].date = date;
  jobs[idx].updated_at = new Date().toISOString();

  saveJobs(jobs);
  res.json({ success: true, job: jobs[idx] });
});

// DELETE job
router.delete('/jobs/:id', requireAuth, (req, res) => {
  const jobs = loadJobs();
  const idx = jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Job not found' });

  const job = jobs[idx];
  // Remove image files
  const imgPath = path.join(JOB_UPLOAD_DIR, path.basename(job.image_url || ''));
  const thumbPath = path.join(THUMB_DIR, path.basename(job.thumbnail_url || ''));
  [imgPath, thumbPath].forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {} });

  jobs.splice(idx, 1);
  saveJobs(jobs);
  res.json({ success: true, message: 'Job deleted' });
});

module.exports = router;