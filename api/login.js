import sql from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'microfinance-secret-key-change-in-production';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier les identifiants dans Neon
    const admins = await sql`
      SELECT id, email, password_hash FROM admins WHERE LOWER(email) = LOWER(${email.trim()})
    `;

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const admin = admins[0];
    const bcrypt = await import('bcryptjs');
    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      admin: { email: admin.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}

