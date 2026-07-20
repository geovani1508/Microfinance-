import sql from './db.js';
import jwt from 'jsonwebtoken';
import initDB from './init-db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  if (req.body === undefined || req.body === null) {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      if (chunks.length) {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch {
      return {};
    }
  }

  return {};
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
    await initDB();

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

    const body = await parseBody(req);
    const rawId = body.id ?? req.query?.id;
    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'ID requis' });
    }

    await sql`DELETE FROM submissions WHERE id = ${parsedId}`;

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

