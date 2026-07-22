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

function writeSubmissions(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Erreur écriture fichier:', err);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Read body
    let body = {};
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const rawId = body.id ?? req.query?.id;

    if (!rawId) {
      return res.status(400).json({ error: 'ID requis' });
    }

    // Read submissions, filter out the one to delete
    const submissions = readSubmissions();
    const filtered = submissions.filter(s => s.id !== rawId);

    if (filtered.length === submissions.length) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }

    writeSubmissions(filtered);

    return res.status(200).json({
      success: true,
      message: 'Soumission supprimée avec succès',
      admin: decoded?.email || null
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
}

