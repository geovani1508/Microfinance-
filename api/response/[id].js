import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const DATA_FILE = path.resolve('/tmp', 'submissions.json');
const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

function readSubmissions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erreur lecture fichier:', err);
  }
  return [];
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    // Read submissions from JSON file
    const submissions = readSubmissions();
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }

    return res.status(200).json({
      success: true,
      submission
    });

  } catch (error) {
    console.error('Response detail error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
}

