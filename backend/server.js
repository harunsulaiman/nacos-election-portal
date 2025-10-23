const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// ✅ Middleware (allow Vercel + local frontend)
app.use(cors({
  origin: [
    'https://nacos-election-portal.vercel.app', // your Vercel frontend URL
    'http://localhost:3000' // allow local testing
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// ✅ Data file paths
const candidatesFile = path.join(__dirname, 'candidates.json');
const votersFile = path.join(__dirname, 'voters.json');
const configFile = path.join(__dirname, 'electionConfig.json');
const dataFile = path.join(__dirname, 'electionData.json');

// ✅ Load candidates
let candidates = [];
if (fs.existsSync(candidatesFile)) {
  try {
    candidates = JSON.parse(fs.readFileSync(candidatesFile, 'utf8'));
  } catch (err) {
    console.error('Error parsing candidates.json:', err.message);
  }
} else {
  console.warn('candidates.json not found, using empty array');
  candidates = [];
}

// ✅ Load voters
let eligibleVoters = [];
if (fs.existsSync(votersFile)) {
  try {
    eligibleVoters = JSON.parse(fs.readFileSync(votersFile, 'utf8'));
  } catch (err) {
    console.error('Error parsing voters.json:', err.message);
  }
} else {
  console.warn('voters.json not found, using empty array');
  eligibleVoters = [];
}

// ✅ Load election config
let electionConfig = {
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
if (fs.existsSync(configFile)) {
  try {
    electionConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (err) {
    console.error('Error parsing electionConfig.json:', err.message);
  }
} else {
  console.warn('electionConfig.json not found, using default config');
  fs.writeFileSync(configFile, JSON.stringify(electionConfig, null, 2));
}

// ✅ Initialize election data
let electionData = {
  votes: {},
  voters: {},
};

const initializeVotes = () => {
  const votes = {};
  candidates.forEach((candidate) => {
    if (!votes[candidate.position]) {
      votes[candidate.position] = {};
    }
    votes[candidate.position][candidate.id] = 0;
  });
  return votes;
};

if (fs.existsSync(dataFile)) {
  try {
    electionData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const initializedVotes = initializeVotes();
    electionData.votes = { ...initializedVotes, ...electionData.votes };
  } catch (err) {
    console.error('Error loading election data:', err.message);
    electionData.votes = initializeVotes();
  }
} else {
  electionData.votes = initializeVotes();
}

// ✅ Helper functions
const saveData = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(electionData, null, 2));
  } catch (err) {
    console.error('Error saving election data:', err.message);
  }
};

const saveConfig = () => {
  try {
    fs.writeFileSync(configFile, JSON.stringify(electionConfig, null, 2));
  } catch (err) {
    console.error('Error saving election config:', err.message);
  }
};

// ✅ Routes
app.get('/', (req, res) => res.send('✅ NACOS Backend is running!'));

// Election status
app.get('/api/election-status', (req, res) => {
  const now = new Date();
  const start = new Date(electionConfig.startTime);
  const end = new Date(electionConfig.endTime);
  let status = 'pending';
  if (now >= start && now <= end) status = 'active';
  else if (now > end) status = 'ended';
  res.json({ status });
});

// Get candidates
app.get('/api/candidates', (req, res) => {
  res.json(candidates);
});

// Validate voter ID
app.post('/api/validate-voter', (req, res) => {
  const now = new Date();
  const start = new Date(electionConfig.startTime);
  const end = new Date(electionConfig.endTime);

  if (now < start)
    return res.status(403).json({ isEligible: false, error: 'Election has not started yet.' });
  if (now > end)
    return res.status(403).json({ isEligible: false, error: 'Election has ended.' });

  const { voterId } = req.body;
  if (!voterId) return res.status(400).json({ error: 'Voter ID is required' });

  const isValid = eligibleVoters.map(v => v.trim().toUpperCase()).includes(voterId.trim().toUpperCase());
  if (isValid) {
    res.json({ isEligible: true, hasVoted: electionData.voters[voterId] || {} });
  } else {
    res.status(403).json({ isEligible: false, error: 'Invalid voter ID' });
  }
});

// Submit vote
app.post('/api/submit-vote', (req, res) => {
  const now = new Date();
  const start = new Date(electionConfig.startTime);
  const end = new Date(electionConfig.endTime);

  if (now < start)
    return res.status(403).json({ error: 'Election has not started yet.' });
  if (now > end)
    return res.status(403).json({ error: 'Election has ended.' });

  const { voterId, selectedCandidates } = req.body;
  if (!voterId || !selectedCandidates)
    return res.status(400).json({ error: 'Voter ID and selections required' });

  // ✅ FIXED validation
  const isValidVoter = eligibleVoters
    .map(v => v.trim().toUpperCase())
    .includes(voterId.trim().toUpperCase());

  if (!isValidVoter)
    return res.status(403).json({ error: 'Unauthorized voter' });

  if (!electionData.voters[voterId]) electionData.voters[voterId] = {};
  const updatedVotes = { ...electionData.votes };
  let voteRecorded = false;

  Object.keys(selectedCandidates).forEach((position) => {
    const candidateId = selectedCandidates[position];
    if (
      candidateId &&
      !electionData.voters[voterId][position] &&
      candidates.some((c) => c.position === position && c.id === candidateId)
    ) {
      updatedVotes[position][candidateId] = (updatedVotes[position][candidateId] || 0) + 1;
      electionData.voters[voterId][position] = true;
      voteRecorded = true;
    }
  });

  if (!voteRecorded)
    return res.status(400).json({ error: 'No valid votes to record' });

  electionData.votes = updatedVotes;
  saveData();
  res.json({ votes: electionData.votes, hasVoted: electionData.voters });
});

// Get election results
app.get('/api/results', (req, res) => {
  const now = new Date();
  const start = new Date(electionConfig.startTime);
  if (now < start)
    return res.status(403).json({ error: 'Election has not started yet.' });
  res.json({ votes: electionData.votes });
});

// Admin routes
app.post('/api/update-votes', (req, res) => {
  const { votes, adminPassword } = req.body;
  if (adminPassword !== 'admin123')
    return res.status(403).json({ error: 'Invalid admin password' });
  if (!votes)
    return res.status(400).json({ error: 'Votes data required' });
  electionData.votes = votes;
  saveData();
  res.json({ success: true });
});

app.post('/api/update-config', (req, res) => {
  const { startTime, endTime, adminPassword } = req.body;
  if (adminPassword !== 'admin123')
    return res.status(403).json({ error: 'Invalid admin password' });
  if (!startTime || !endTime)
    return res.status(400).json({ error: 'Start and end times required' });

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start) || isNaN(end) || start >= end)
    return res.status(400).json({ error: 'Invalid start or end time' });

  electionConfig.startTime = startTime;
  electionConfig.endTime = endTime;
  saveConfig();
  res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
  const { adminPassword } = req.body;
  if (adminPassword !== 'admin123')
    return res.status(403).json({ error: 'Invalid admin password' });
  electionData.votes = initializeVotes();
  electionData.voters = {};
  saveData();
  res.json({ success: true });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Backend server running on http://localhost:${port}`);
});
