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

    // Get filter from query params
    const filterEmail = req.query.email?.trim().toLowerCase() || '';

    // Read submissions from JSON file
    const allSubmissions = readSubmissions();

    // Sort by created_at DESC
    allSubmissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Filter by email if needed
    let submissions = allSubmissions;
    if (filterEmail) {
      submissions = allSubmissions.filter(s => 
        s.email?.toLowerCase().includes(filterEmail)
      );
    }

    // Return only summary fields
    const summary = submissions.map(s => ({
      id: s.id,
      email: s.email,
      full_name: s.full_name,
      phone: s.phone,
      loan_amount: s.loan_amount,
      created_at: s.created_at
    }));

    return res.status(200).json({
      success: true,
      submissions: summary
    });

  } catch (error) {
    console.error('Responses error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
}

