import sql from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

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
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Get filter from query params
    const filterEmail = req.query.email?.trim().toLowerCase() || '';

    // Fetch submissions
    let submissions;
    if (filterEmail) {
      submissions = await sql`
        SELECT id, email, full_name, phone, loan_amount, created_at
        FROM submissions
        WHERE LOWER(email) LIKE ${'%' + filterEmail + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      submissions = await sql`
        SELECT id, email, full_name, phone, loan_amount, created_at
        FROM submissions
        ORDER BY created_at DESC
      `;
    }

    return res.status(200).json({
      success: true,
      submissions
    });

  } catch (error) {
    console.error('Responses error:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
}

