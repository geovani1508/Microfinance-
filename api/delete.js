import sql from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

export default async function handler(req, res) {
  // CORS headers
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

    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    // Delete submission
    await sql`
      DELETE FROM submissions WHERE id = ${parseInt(id)}
    `;

    return res.status(200).json({
      success: true,
      message: 'Soumission supprimée avec succès'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
}

</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
