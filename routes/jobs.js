const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../storage');

const DATA_FILE = path.join(DATA_DIR, 'jobs.json');

function loadJobs() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

// GET all jobs (with optional category filter)
router.get('/', (req, res) => {
  let jobs = loadJobs();
  if (req.query.category) {
    jobs = jobs.filter(j => j.category.toLowerCase() === req.query.category.toLowerCase());
  }
  jobs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, jobs });
});

// GET single job
router.get('/:id', (req, res) => {
  const jobs = loadJobs();
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, job });
});

module.exports = router;